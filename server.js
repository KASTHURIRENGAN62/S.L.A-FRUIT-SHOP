if (!globalThis.crypto || !globalThis.crypto.getRandomValues) {
  const { webcrypto } = require('crypto');
  globalThis.crypto = webcrypto;
}

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const passport = require('./config/passport');

// Short-lived sessions. Only used to hold the OAuth 2.0 PKCE state + code
// verifier during the X/Twitter login handshake; login itself is JWT-based.
app.use(session({
  secret: process.env.JWT_SECRET || 'change-me-to-a-long-random-string',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 10 * 60 * 1000 }
}));

app.use(passport.initialize());

app.use('/api/contact', require('./routes/contact'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/account', require('./routes/account'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/orders', require('./routes/orders'));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'reset-password.html'));
});

app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});

app.get('/delete-account', (req, res) => {
  res.sendFile(path.join(__dirname, 'delete-account.html'));
});

// express.static ignores dotfiles by default, so .well-known must be served
// explicitly for Android Digital Asset Links verification.
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.type('application/json');
  res.sendFile(path.join(__dirname, '.well-known', 'assetlinks.json'));
});

app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, () => {
  console.log(`Fruit Shop running at http://localhost:${PORT}`);
});
