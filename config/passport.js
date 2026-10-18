const passport = require('passport');
const util = require('util');
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter-oauth2.0').Strategy;
const OAuth2Strategy = require('passport-oauth2').Strategy;
const InternalOAuthError = require('passport-oauth2').InternalOAuthError;
const User = require('../models/User');

/*
 * NOTE ON INSTAGRAM:
 * Meta shut down the old "Instagram Basic Display API" (the thing that let a
 * regular Instagram user click "Continue with Instagram" on a random website)
 * in December 2024 / fully sunset September 2025. Today the only path is
 * "Instagram API with Instagram Login" (OAuth 2.0 via api.instagram.com),
 * which requires the user to have an Instagram PROFESSIONAL (Business or
 * Creator) account - personal accounts have no API access at all.
 *
 * Instagram login below is a SEPARATE strategy from Facebook login (its own
 * authorize/token/profile calls against Instagram's endpoints), not a reuse
 * of passport-facebook. It still uses the same Facebook App credentials,
 * because the "Instagram" product lives inside your Facebook app, but the
 * flow is independent. It will only work for Professional Instagram
 * accounts that have approved the app.
 */

async function findOrCreateSocialUser({ provider, providerId, name, email, avatar }) {
  let user = await User.findOne({ provider, providerId });
  if (user) return user;

  // If they already have a local (email/password) account with the same email,
  // link this social identity to it instead of creating a duplicate account.
  if (email) {
    user = await User.findOne({ email });
    if (user) {
      if (!user.providerId) {
        user.provider = provider;
        user.providerId = providerId;
        user.avatar = user.avatar || avatar;
        await user.save();
      }
      return user;
    }
  }

  user = await User.create({
    name: name || 'New User',
    email: email || `${provider}_${providerId}@no-email.fruitshop.local`,
    provider,
    providerId,
    avatar
  });
  return user;
}

// Track which providers actually have credentials set, so routes/auth.js
// can tell real users "this isn't set up yet" instead of the server
// crashing on startup. passport-facebook/twitter throw immediately if you
// try to register a strategy with an empty clientID/consumerKey, so we only
// register each strategy when its keys are present.
const enabledProviders = { facebook: false, instagram: false, twitter: false };

const facebookCallbackURL =
  process.env.FACEBOOK_CALLBACK_URL ||
  `${process.env.CLIENT_URL || 'http://localhost:3000'}/api/auth/facebook/callback`;

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: facebookCallbackURL,
    profileFields: ['id', 'displayName', 'emails', 'photos']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateSocialUser({
        provider: 'facebook',
        providerId: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        avatar: profile.photos?.[0]?.value
      });
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
  enabledProviders.facebook = true;
  console.log(`Facebook login enabled with callback ${facebookCallbackURL}`);
} else {
  console.log('Facebook login disabled - set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in .env to enable.');
}

// Standalone Instagram strategy (Instagram API with Instagram Login, OAuth 2.0).
// Uses the same Facebook App credentials as the Instagram product inside the
// app, but talks to Instagram's own endpoints instead of reusing Facebook login.
function InstagramStrategy(options, verify) {
  options.authorizationURL = options.authorizationURL || 'https://api.instagram.com/oauth/authorize';
  options.tokenURL = options.tokenURL || 'https://api.instagram.com/oauth/access_token';
  options.scope = options.scope || ['instagram_business_basic'];
  OAuth2Strategy.call(this, options, verify);
  this.name = 'instagram';
  this._userProfileURL = 'https://graph.instagram.com/me?fields=id,username,account_type,profile_picture_url';
}

util.inherits(InstagramStrategy, OAuth2Strategy);

InstagramStrategy.prototype.userProfile = function(accessToken, done) {
  this._oauth2.useAuthorizationHeaderforGET(true);
  this._oauth2.get(this._userProfileURL, accessToken, function(err, body) {
    if (err) {
      return done(new InternalOAuthError('Failed to fetch Instagram profile', err));
    }
    let profile;
    try {
      const data = JSON.parse(body);
      profile = { provider: 'instagram', _raw: body, ...data };
    } catch (e) {
      return done(new InternalOAuthError('Failed to parse Instagram profile', e));
    }
    return done(null, profile);
  });
};

const instagramCallbackURL =
  process.env.INSTAGRAM_CALLBACK_URL ||
  `${process.env.CLIENT_URL || 'http://localhost:3000'}/api/auth/instagram/callback`;

const instagramClientID = process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_APP_ID;
const instagramClientSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET;

if (instagramClientID && instagramClientSecret) {
  passport.use(new InstagramStrategy({
    clientID: instagramClientID,
    clientSecret: instagramClientSecret,
    callbackURL: instagramCallbackURL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateSocialUser({
        provider: 'instagram',
        providerId: profile.id,
        name: profile.username,
        email: profile.email,
        avatar: profile.profile_picture_url
      });
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
  enabledProviders.instagram = true;
  console.log(`Instagram (OAuth 2.0) login enabled with callback ${instagramCallbackURL}`);
} else {
  console.log('Instagram login disabled - set INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET in .env to enable.');
}

const twitterCallbackURL =
  process.env.TWITTER_CALLBACK_URL ||
  `${process.env.CLIENT_URL || 'http://localhost:3000'}/api/auth/twitter/callback`;

if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
  passport.use(new TwitterStrategy({
    clientID: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    callbackURL: twitterCallbackURL,
    clientType: 'public',
    pkce: true,
    state: true,
    scope: ['users.read', 'tweet.read', 'offline.access']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateSocialUser({
        provider: 'twitter',
        providerId: profile.id,
        name: profile.name,
        email: profile.email,
        avatar: profile.profile_image_url
      });
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
  enabledProviders.twitter = true;
  console.log(`Twitter (OAuth 2.0) login enabled with callback ${twitterCallbackURL}`);
} else {
  console.log('Twitter login disabled - set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET in .env to enable.');
}

passport.enabledProviders = enabledProviders;

// We only use passport to run the OAuth handshake, not for session-based
// login (the app issues JWTs), but passport still needs (de)serialize
// functions defined whenever sessions are enabled. Sessions are required by
// the X/Twitter OAuth 2.0 PKCE + state flow (express-session in server.js).
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
