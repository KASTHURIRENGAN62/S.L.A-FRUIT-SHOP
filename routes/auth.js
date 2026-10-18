const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const router = express.Router();
const User = require('../models/User');
const { sendMail } = require('../utils/mailer');
const { notifyWhatsApp } = require('../utils/whatsapp');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:' + (process.env.PORT || 3000);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// The raw token is emailed to the user; only its hash is stored in MongoDB,
// so a leaked database dump can't be used to reset other accounts.
function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Redirects back to the frontend with the JWT in the URL after a successful
// social login. main.js picks this up on page load and strips it from the URL.
function sendSocialUserToFrontend(res, user) {
  const token = generateToken(user._id);
  const userPayload = encodeURIComponent(JSON.stringify({ id: user._id, name: user.name, email: user.email }));
  res.redirect(`${CLIENT_URL}/?authToken=${token}&authUser=${userPayload}`);
}

router.post('/signup', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const phone = String(req.body.phone || '').trim();
    const password = String(req.body.password || '');

    if (!name) {
      return res.status(400).json({ error: 'Please enter your full name' });
    }
    if (name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (phone && phone.length > 20) {
      return res.status(400).json({ error: 'Phone number is too long' });
    }

    // Emails are stored lowercased, so the duplicate check is always exact.
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Try signing in instead.' });
    }

    const user = await User.create({ name, email, phone, password });
    const token = generateToken(user._id);

    notifyWhatsApp(
      'NEW SIGNUP - S.L.A Fruit Shop\n' +
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Phone: ${phone || '-'}\n` +
        `Signed up: ${new Date().toLocaleString()}`
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    // 11000 = duplicate key; can happen if two signups race each other.
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists. Try signing in instead.' });
    }
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Please enter your password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }
    const token = generateToken(user._id);
    res.json({
      message: 'Signed in successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// Emails a one-time password-reset link. Responds identically whether or not
// the account exists so we don't leak which emails have signed up.
router.post('/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email });
    if (user && user.provider === 'local') {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = hashResetToken(token);
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      const resetUrl = `${CLIENT_URL}/reset-password?token=${token}`;
      const text = `Hi ${user.name},\n\nWe received a request to reset your S.L.A Fruit Shop password. Click the link below to choose a new one:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.\n\n- S.L.A Fruit Shop`;
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <h2 style="color:#1a1a2e">Reset your password</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your S.L.A Fruit Shop password. Click the button below to choose a new one:</p>
          <p style="text-align:center;margin:28px 0">
            <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Reset password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break:break-all;color:#6b7280;font-size:13px">${resetUrl}</p>
          <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          <p style="margin-top:24px;color:#9ca3af;font-size:12px">- S.L.A Fruit Shop, Kattumavadi</p>
        </div>`;

      try {
        await sendMail({ to: user.email, subject: 'Reset your S.L.A Fruit Shop password', text, html });
      } catch (mailErr) {
        if (mailErr.code === 'EMAIL_NOT_CONFIGURED') {
          // Dev fallback: no SMTP set up yet, print the link to the server console.
          console.warn(`[forgot-password] Email not configured. Reset link for ${user.email}:\n${resetUrl}`);
        } else {
          console.error('Reset email error:', mailErr);
          return res.status(500).json({ error: 'Could not send the reset email. Please try again later.' });
        }
      }
    }

    res.json({ message: 'If an account exists for that email, a password reset link has been sent.' });
  } catch (err) {
    console.error('Forgot-password error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const token = String(req.body.token || '');
    const password = String(req.body.password || '');

    if (!token) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      resetPasswordToken: hashResetToken(token),
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Your password has been reset. You can now sign in.' });
  } catch (err) {
    console.error('Reset-password error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// ============ SOCIAL LOGIN (Facebook / Instagram / Twitter) ============
// Each provider needs API keys set in .env (see .env.example). If a
// provider's keys aren't configured, its buttons will just error out
// gracefully on the frontend instead of crashing the server.

function requireProvider(name) {
  return (req, res, next) => {
    if (!passport.enabledProviders[name]) {
      return res.status(503).send(
        `${name[0].toUpperCase()}${name.slice(1)} login isn't set up yet - the site owner needs to add ` +
        `${name === 'twitter' ? 'TWITTER_CLIENT_ID / TWITTER_CLIENT_SECRET' : 'FACEBOOK_APP_ID / FACEBOOK_APP_SECRET'} to .env.`
      );
    }
    next();
  };
}

// Handles the OAuth callback with a custom handler so failures are logged
// on the server AND passed back to the frontend (as ?authError=&authMessage=)
// instead of silently redirecting. The frontend shows the message in the
// sign-in form so users (and the site owner) can see why login failed.
function socialAuthCallback(provider) {
  return (req, res, next) => {
    passport.authenticate(provider, { session: false }, (err, user) => {
      if (err) {
        console.error(`[${provider} OAuth] callback error:`, err);
        const msg = encodeURIComponent(err.message || 'authentication failed');
        return res.redirect(`${CLIENT_URL}/?authError=${provider}&authMessage=${msg}`);
      }
      if (!user) {
        return res.redirect(`${CLIENT_URL}/?authError=${provider}`);
      }
      req.user = user;
      next();
    })(req, res, next);
  };
}

router.get('/facebook', requireProvider('facebook'), passport.authenticate('facebook', { scope: ['email'], session: false }));
router.get('/facebook/callback',
  requireProvider('facebook'),
  socialAuthCallback('facebook'),
  (req, res) => sendSocialUserToFrontend(res, req.user)
);

router.get('/instagram', requireProvider('instagram'), passport.authenticate('instagram', { session: false }));
router.get('/instagram/callback',
  requireProvider('instagram'),
  socialAuthCallback('instagram'),
  (req, res) => sendSocialUserToFrontend(res, req.user)
);

router.get('/twitter', requireProvider('twitter'), passport.authenticate('twitter', { session: false }));
router.get('/twitter/callback',
  requireProvider('twitter'),
  socialAuthCallback('twitter'),
  (req, res) => sendSocialUserToFrontend(res, req.user)
);

module.exports = router;
