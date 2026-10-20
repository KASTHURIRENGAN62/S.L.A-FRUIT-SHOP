const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');

const CSRF_PURPOSE = 'delete-account';
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

const attempts = new Map();

function checkRateLimit(key) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}

function resetRateLimit(key) {
  attempts.delete(key);
}

async function requireUser(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session is no longer valid. Please sign in again.' });
    }
    req.user = user;
    req.userId = String(user._id);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function issueCsrfToken(userId) {
  return jwt.sign(
    { purpose: CSRF_PURPOSE, userId: String(userId) },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
}

function verifyCsrfToken(token, userId) {
  if (!token || typeof token !== 'string') return false;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.purpose === CSRF_PURPOSE && String(decoded.userId) === String(userId);
  } catch (err) {
    return false;
  }
}

router.get('/csrf', requireUser, (req, res) => {
  res.json({ csrfToken: issueCsrfToken(req.userId) });
});

router.delete('/', requireUser, async (req, res) => {
  const rate = checkRateLimit(req.userId);
  if (!rate.allowed) {
    res.set('Retry-After', String(rate.retryAfter));
    return res.status(429).json({ error: 'Too many deletion attempts. Please try again later.' });
  }

  if (!verifyCsrfToken(req.headers['x-csrf-token'], req.userId)) {
    return res.status(403).json({ error: 'Invalid or missing CSRF token. Please reload the page and try again.' });
  }

  const confirm = String((req.body && req.body.confirm) || '').trim();
  const password = String((req.body && req.body.password) || '');
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();

  if (confirm !== 'DELETE') {
    return res.status(400).json({ error: 'Type DELETE to confirm account deletion.' });
  }

  const user = req.user;
  const provider = user.provider || 'local';

  if (provider === 'local') {
    if (!password) {
      return res.status(400).json({ error: 'Your current password is required.' });
    }
    const matches = await user.comparePassword(password);
    if (!matches) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }
  } else {
    if (!email || email !== String(user.email || '').trim().toLowerCase()) {
      return res.status(401).json({ error: 'Enter the email address for this account to confirm.' });
    }
  }

  try {
    await Order.updateMany(
      { userId: user._id },
      {
        $set: {
          userId: null,
          customerName: 'Deleted customer',
          phone: 'redacted',
          address: 'redacted'
        },
        $unset: {
          email: 1,
          'paymentDetails.upiId': 1,
          'paymentDetails.bankName': 1
        }
      }
    );

    await user.deleteOne();
    resetRateLimit(req.userId);

    if (req.session && typeof req.session.destroy === 'function') {
      req.session.destroy(() => {});
    }

    return res.json({ message: 'Your account has been deleted.' });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(500).json({ error: 'Could not delete the account. Please try again.' });
  }
});

module.exports = router;
module.exports._resetRateLimit = resetRateLimit;
