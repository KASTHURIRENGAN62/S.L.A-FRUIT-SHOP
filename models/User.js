const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  // Password is only required for accounts created with email/password ("local").
  // Accounts created via Facebook/Instagram/Twitter don't have (or need) a password.
  password: { type: String, required: function () { return this.provider === 'local'; } },

  // ----- Social login -----
  provider: { type: String, enum: ['local', 'facebook', 'twitter', 'instagram'], default: 'local' },
  providerId: { type: String }, // the id returned by the social provider
  avatar: { type: String },

  // ----- Forgot-password reset -----
  // Only the SHA-256 hash of the token is stored, never the raw token.
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  createdAt: { type: Date, default: Date.now }
});

// A given provider account (e.g. the same Facebook user) should only ever map
// to one User doc. A partial index is used instead of sparse: sparse would also
// index local accounts (provider defaults to "local" with providerId null),
// making every new local signup collide with the first local user (E11000).
userSchema.index(
  { provider: 1, providerId: 1 },
  { unique: true, partialFilterExpression: { providerId: { $type: 'string' } } }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // social-only account, no local password set
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
