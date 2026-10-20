const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const express = require('express');

process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';

const users = new Map();

function createUser(overrides) {
  const data = Object.assign({
    _id: 'user-1',
    name: 'Test Customer',
    email: 'customer@example.com',
    provider: 'local',
    password: 'correct-password'
  }, overrides);

  const user = {
    _id: data._id,
    name: data.name,
    email: data.email,
    provider: data.provider,
    async comparePassword(candidate) {
      return candidate === data.password;
    },
    async deleteOne() {
      users.delete(data._id);
    }
  };

  users.set(data._id, user);
  return user;
}

const UserMock = {
  async findById(id) {
    return users.get(String(id)) || null;
  }
};

const orderCalls = [];
const OrderMock = {
  async updateMany(filter, update) {
    orderCalls.push({ filter, update });
    return { modifiedCount: 1 };
  }
};

const userModelPath = require.resolve('../models/User');
const orderModelPath = require.resolve('../models/Order');
require.cache[userModelPath] = {
  id: userModelPath,
  filename: userModelPath,
  loaded: true,
  exports: UserMock
};
require.cache[orderModelPath] = {
  id: orderModelPath,
  filename: orderModelPath,
  loaded: true,
  exports: OrderMock
};

const accountRouter = require('../routes/account');

const app = express();
app.use(express.json());
app.use('/api/account', accountRouter);

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = 'http://127.0.0.1:' + server.address().port;
});

test.after(() => {
  server.close();
});

function tokenFor(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

async function request(method, route, options) {
  const opts = options || {};
  const headers = Object.assign({}, opts.headers || {});
  if (opts.token) headers.Authorization = 'Bearer ' + opts.token;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(baseUrl + route, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body)
  });

  let body = null;
  try {
    body = await res.json();
  } catch (err) {
    body = null;
  }

  return { status: res.status, body, headers: res.headers };
}

async function getCsrf(token) {
  const res = await request('GET', '/api/account/csrf', { token });
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.csrfToken);
  return res.body.csrfToken;
}

test('CSRF token requires authentication', async () => {
  const res = await request('GET', '/api/account/csrf');
  assert.strictEqual(res.status, 401);
});

test('CSRF token is scoped to the signed-in user and purpose', async () => {
  createUser({ _id: 'csrf-user', email: 'csrf@example.com' });
  const token = tokenFor('csrf-user');
  const csrfToken = await getCsrf(token);
  const decoded = jwt.verify(csrfToken, process.env.JWT_SECRET);
  assert.strictEqual(decoded.purpose, 'delete-account');
  assert.strictEqual(String(decoded.userId), 'csrf-user');
});

test('DELETE without a token is rejected', async () => {
  const res = await request('DELETE', '/api/account', {
    body: { confirm: 'DELETE' }
  });
  assert.strictEqual(res.status, 401);
});

test('DELETE without a CSRF token is rejected', async () => {
  createUser({ _id: 'no-csrf', email: 'nocsrf@example.com', password: 'pw' });
  const res = await request('DELETE', '/api/account', {
    token: tokenFor('no-csrf'),
    body: { confirm: 'DELETE', password: 'pw' }
  });
  assert.strictEqual(res.status, 403);
});

test("another user's CSRF token is rejected", async () => {
  createUser({ _id: 'csrfa', email: 'a@example.com', password: 'pw-a' });
  createUser({ _id: 'csrfbf', email: 'b@example.com', password: 'pw-b' });
  const csrfForA = await getCsrf(tokenFor('csrfa'));

  const res = await request('DELETE', '/api/account', {
    token: tokenFor('csrfbf'),
    headers: { 'X-CSRF-Token': csrfForA },
    body: { confirm: 'DELETE', password: 'pw-b' }
  });
  assert.strictEqual(res.status, 403);
  assert.ok(users.has('csrfbf'));
});

test('the confirmation phrase must be exactly DELETE', async () => {
  createUser({ _id: 'bad-confirm', email: 'confirm@example.com', password: 'pw' });
  const token = tokenFor('bad-confirm');
  const csrfToken = await getCsrf(token);

  const res = await request('DELETE', '/api/account', {
    token,
    headers: { 'X-CSRF-Token': csrfToken },
    body: { confirm: 'delete', password: 'pw' }
  });
  assert.strictEqual(res.status, 400);
  assert.ok(users.has('bad-confirm'));
});

test('local accounts must re-enter the correct password', async () => {
  createUser({ _id: 'local-wrong', email: 'local@example.com', password: 'right-password' });
  const token = tokenFor('local-wrong');
  const csrfToken = await getCsrf(token);

  const res = await request('DELETE', '/api/account', {
    token,
    headers: { 'X-CSRF-Token': csrfToken },
    body: { confirm: 'DELETE', password: 'wrong-password' }
  });
  assert.strictEqual(res.status, 401);
  assert.ok(users.has('local-wrong'));
  assert.strictEqual(orderCalls.length, 0);
});

test('successful local deletion removes the user and anonymises orders', async () => {
  createUser({ _id: 'local-ok', email: 'local-ok@example.com', password: 'my-password' });
  const token = tokenFor('local-ok');
  const csrfToken = await getCsrf(token);

  const res = await request('DELETE', '/api/account', {
    token,
    headers: { 'X-CSRF-Token': csrfToken },
    body: { confirm: 'DELETE', password: 'my-password' }
  });

  assert.strictEqual(res.status, 200);
  assert.match(res.body.message, /deleted/i);
  assert.strictEqual(users.has('local-ok'), false);

  assert.strictEqual(orderCalls.length, 1);
  const call = orderCalls[0];
  assert.strictEqual(String(call.filter.userId), 'local-ok');
  assert.strictEqual(call.update.$set.userId, null);
  assert.strictEqual(call.update.$set.customerName, 'Deleted customer');
  assert.strictEqual(call.update.$set.phone, 'redacted');
  assert.strictEqual(call.update.$set.address, 'redacted');
  assert.strictEqual(call.update.$unset.email, 1);
  assert.strictEqual(call.update.$unset['paymentDetails.upiId'], 1);
  assert.strictEqual(call.update.$unset['paymentDetails.bankName'], 1);
});

test('the old JWT stops working after deletion', async () => {
  createUser({ _id: 'token-after', email: 'after@example.com', password: 'pw' });
  const token = tokenFor('token-after');
  const csrfToken = await getCsrf(token);

  const del = await request('DELETE', '/api/account', {
    token,
    headers: { 'X-CSRF-Token': csrfToken },
    body: { confirm: 'DELETE', password: 'pw' }
  });
  assert.strictEqual(del.status, 200);

  const reuse = await request('GET', '/api/account/csrf', { token });
  assert.strictEqual(reuse.status, 401);
});

test('social accounts must confirm with the account email', async () => {
  createUser({
    _id: 'social-user',
    email: 'social@example.com',
    provider: 'facebook',
    password: null
  });
  const token = tokenFor('social-user');
  const csrfToken = await getCsrf(token);

  const wrongEmail = await request('DELETE', '/api/account', {
    token,
    headers: { 'X-CSRF-Token': csrfToken },
    body: { confirm: 'DELETE', email: 'other@example.com' }
  });
  assert.strictEqual(wrongEmail.status, 401);

  const missingEmail = await request('DELETE', '/api/account', {
    token,
    headers: { 'X-CSRF-Token': csrfToken },
    body: { confirm: 'DELETE' }
  });
  assert.strictEqual(missingEmail.status, 401);
  assert.ok(users.has('social-user'));

  const ok = await request('DELETE', '/api/account', {
    token,
    headers: { 'X-CSRF-Token': csrfToken },
    body: { confirm: 'DELETE', email: 'SOCIAL@example.com' }
  });
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(users.has('social-user'), false);
});

test('repeated deletion attempts are rate limited', async () => {
  createUser({ _id: 'rate-limited', email: 'rate@example.com', password: 'right' });
  const token = tokenFor('rate-limited');
  const csrfToken = await getCsrf(token);

  for (let i = 0; i < 5; i += 1) {
    const res = await request('DELETE', '/api/account', {
      token,
      headers: { 'X-CSRF-Token': csrfToken },
      body: { confirm: 'DELETE', password: 'wrong' }
    });
    assert.strictEqual(res.status, 401, 'attempt ' + (i + 1) + ' should be a password failure');
  }

  const blocked = await request('DELETE', '/api/account', {
    token,
    headers: { 'X-CSRF-Token': csrfToken },
    body: { confirm: 'DELETE', password: 'right' }
  });
  assert.strictEqual(blocked.status, 429);
  assert.ok(blocked.headers.get('retry-after'));
  assert.ok(users.has('rate-limited'));
});

test('GET on the deletion endpoint does not delete anything', async () => {
  createUser({ _id: 'get-only', email: 'get@example.com', password: 'pw' });
  const res = await request('GET', '/api/account', { token: tokenFor('get-only') });
  assert.strictEqual(res.status, 404);
  assert.ok(users.has('get-only'));
});

test('privacy and delete-account pages and server routes exist', () => {
  const root = path.join(__dirname, '..');
  assert.ok(fs.existsSync(path.join(root, 'privacy-policy.html')));
  assert.ok(fs.existsSync(path.join(root, 'delete-account.html')));

  const serverSource = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.match(serverSource, /app\.get\('\/privacy-policy'/);
  assert.match(serverSource, /app\.get\('\/delete-account'/);
  assert.match(serverSource, /app\.use\('\/api\/account'/);
});
