const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
}

function pngSize(file) {
  const buffer = fs.readFileSync(path.join(root, file));
  assert.deepStrictEqual(
    Array.from(buffer.subarray(0, 8)),
    [137, 80, 78, 71, 13, 10, 26, 10],
    file + ' is not a PNG'
  );
  assert.strictEqual(buffer.toString('ascii', 12, 16), 'IHDR');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('assetlinks.json has the required structure and no invented fingerprint', () => {
  const assetlinks = readJson('.well-known/assetlinks.json');
  assert.ok(Array.isArray(assetlinks));
  assert.strictEqual(assetlinks.length, 1);

  const statement = assetlinks[0];
  assert.deepStrictEqual(statement.relation, ['delegate_permission/common.handle_all_urls']);
  assert.strictEqual(statement.target.namespace, 'android_app');
  assert.strictEqual(statement.target.package_name, 'com.slafruitshop.app');
  assert.deepStrictEqual(statement.target.sha256_cert_fingerprints, [
    'REPLACE_WITH_REAL_SHA256_CERTIFICATE_FINGERPRINT'
  ]);
  assert.ok(
    !/^[0-9a-f]{64}$/i.test(statement.target.sha256_cert_fingerprints[0]),
    'placeholder must not be replaced with a fabricated fingerprint'
  );
});

test('server serves assetlinks.json before the SPA fallback', () => {
  const source = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  const routeIndex = source.indexOf("app.get('/.well-known/assetlinks.json'");
  const fallbackIndex = source.indexOf("app.get('*'");

  assert.ok(routeIndex > -1, 'explicit assetlinks route is missing');
  assert.ok(fallbackIndex > -1, 'SPA fallback route is missing');
  assert.ok(routeIndex < fallbackIndex, 'assetlinks route must run before the SPA fallback');
  assert.match(source, /application\/json/);
});

test('manifest is valid and icons have the exact declared dimensions', () => {
  const manifest = readJson('manifest.webmanifest');
  assert.strictEqual(manifest.start_url, '/');
  assert.strictEqual(manifest.scope, '/');
  assert.strictEqual(manifest.display, 'standalone');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 3);

  const expected = {
    '/icons/icon-192.png': 192,
    '/icons/icon-512.png': 512,
    '/icons/icon-512-maskable.png': 512
  };

  for (const [src, size] of Object.entries(expected)) {
    const icon = manifest.icons.find((entry) => entry.src === src);
    assert.ok(icon, src + ' is not in the manifest');
    assert.strictEqual(icon.sizes, size + 'x' + size);
    assert.strictEqual(icon.type, 'image/png');

    const actual = pngSize(src.slice(1));
    assert.deepStrictEqual(actual, { width: size, height: size });
  }

  const maskable = manifest.icons.find((entry) => entry.src === '/icons/icon-512-maskable.png');
  assert.strictEqual(maskable.purpose, 'maskable');
});

test('service worker parses and never caches sensitive paths', async () => {
  const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const handlers = {};
  const cachePuts = [];
  const precacheLists = [];
  const offlineResponse = new Response('offline', { status: 200 });

  class MockResponse {
    constructor(body, init) {
      const options = init || {};
      this.body = body;
      this.status = options.status || 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.type = 'basic';
      this.redirected = false;
      this.headers = { get: () => null };
    }

    clone() {
      return this;
    }

    static error() {
      return new MockResponse(null, { status: 500 });
    }
  }

  const cache = {
    async match() {
      return undefined;
    },
    async put(request) {
      cachePuts.push(String(request.url || request));
    },
    async addAll(urls) {
      precacheLists.push(urls.slice());
    }
  };

  const sandbox = {
    URL,
    Response: MockResponse,
    Promise,
    console,
    fetch: async () => new MockResponse('ok', { status: 200 }),
    caches: {
      async open() {
        return cache;
      },
      async match() {
        return offlineResponse;
      },
      async keys() {
        return [];
      },
      async delete() {
        return true;
      }
    },
    self: {
      location: new URL('https://shop.test/sw.js'),
      addEventListener(type, handler) {
        handlers[type] = handler;
      },
      async skipWaiting() {},
      clients: {
        async claim() {}
      }
    }
  };

  vm.runInNewContext(source, sandbox, { filename: 'sw.js' });

  assert.ok(handlers.install, 'install handler is missing');
  assert.ok(handlers.fetch, 'fetch handler is missing');

  const installPromises = [];
  handlers.install({ waitUntil(promise) { installPromises.push(promise); } });
  await Promise.all(installPromises);

  assert.strictEqual(precacheLists.length, 1);
  for (const url of precacheLists[0]) {
    assert.ok(!url.startsWith('/api'), 'precache must not contain API routes: ' + url);
    assert.ok(!/\/admin|\/delete-account|\/reset-password|\/privacy-policy/.test(url));
  }

  function dispatch(pathname, options) {
    const opts = options || {};
    let responded = false;
    handlers.fetch({
      request: {
        method: 'GET',
        url: 'https://shop.test' + pathname,
        mode: opts.mode || 'no-cors',
        destination: opts.destination || ''
      },
      respondWith() {
        responded = true;
      }
    });
    return responded;
  }

  const networkOnly = [
    '/api/auth/me',
    '/api/orders',
    '/api/orders/mine',
    '/api/account/csrf',
    '/api/contact',
    '/admin',
    '/delete-account',
    '/cart',
    '/checkout',
    '/orders',
    '/payments'
  ];

  for (const pathname of networkOnly) {
    assert.strictEqual(dispatch(pathname, { mode: 'navigate', destination: 'document' }), false, pathname + ' must be network-only');
    assert.strictEqual(dispatch(pathname, { destination: 'script' }), false, pathname + ' must be network-only');
  }

  const putsBeforeNavigation = cachePuts.length;
  assert.strictEqual(dispatch('/reset-password?token=secret', { mode: 'navigate', destination: 'document' }), true);
  assert.strictEqual(dispatch('/privacy-policy', { mode: 'navigate', destination: 'document' }), true);
  assert.strictEqual(cachePuts.length, putsBeforeNavigation, 'private navigations must not be cached');

  assert.strictEqual(dispatch('/css/style.css', { destination: 'style' }), true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.strictEqual(cachePuts.length, putsBeforeNavigation + 1, 'public static assets should still be cached');
  assert.ok(cachePuts[cachePuts.length - 1].endsWith('/css/style.css'));
});
