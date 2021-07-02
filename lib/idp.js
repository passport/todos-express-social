var GoogleStrategy = require('passport-google-oauth20');
var FacebookStrategy = require('passport-facebook');
var TwitterStrategy = require('passport-twitter');


exports.create = function(provider) {
  switch (provider) {
  case 'accounts.google.com':
    return new GoogleStrategy({
      clientID: process.env['GOOGLE_CLIENT_ID'],
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
      callbackURL: '/oauth2/redirect/accounts.google.com',
      scope: [ 'profile' ],
      store: true
    },
    function(accessToken, refreshToken, profile, cb) {
      return cb(null, profile);
    });
    
  case 'www.facebook.com':
    return new FacebookStrategy({
      clientID: process.env['FACEBOOK_CLIENT_ID'],
      clientSecret: process.env['FACEBOOK_CLIENT_SECRET'],
      callbackURL: '/oauth2/redirect/www.facebook.com',
      store: true
    },
    function(accessToken, refreshToken, profile, cb) {
      return cb(null, profile);
    });
    
  case 'twitter.com':
    return new TwitterStrategy({
      consumerKey: process.env['TWITTER_CONSUMER_KEY'],
      consumerSecret: process.env['TWITTER_CONSUMER_SECRET'],
      callbackURL: '/oauth/callback/twitter.com'
    },
    function(token, tokenSecret, profile, cb) {
      return cb(null, profile);
    });
  }
};
