var express = require('express');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20');
var FacebookStrategy = require('passport-facebook');
var db = require('../db');


function createStrategy(provider) {
  switch (provider) {
  case 'accounts.google.com':
    return new GoogleStrategy({
      clientID: process.env['GOOGLE_CLIENT_ID'],
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
      callbackURL: '/oauth2/redirect/accounts.google.com',
      scope: [ 'profile' ]
    },
    function(accessToken, refreshToken, profile, cb) {
      return cb(null, profile);
    });
    
  case 'www.facebook.com':
    return new FacebookStrategy({
      clientID: process.env['FACEBOOK_CLIENT_ID'],
      clientSecret: process.env['FACEBOOK_CLIENT_SECRET'],
      callbackURL: '/oauth2/redirect/www.facebook.com'
    },
    function(accessToken, refreshToken, profile, cb) {
      return cb(null, profile);
    });
  }
  
}

function singleSignOn(req, res, next) {
  db.get('SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?', [
    'https://' + req.params.provider,
    req.federatedUser.id
  ], function(err, row) {
    if (err) { return next(err); }
    if (!row) {
      db.run('INSERT INTO users (name) VALUES (?)', [
        req.federatedUser.displayName
      ], function(err) {
        if (err) { return next(err); }
        
        var id = this.lastID;
        db.run('INSERT INTO federated_credentials (provider, subject, user_id) VALUES (?, ?, ?)', [
          'https://' + req.params.provider,
          req.federatedUser.id,
          id
        ], function(err) {
          if (err) { return next(err); }
          var user = {
            id: id.toString(),
            displayName: req.federatedUser.displayName
          };
          req.login(user, function(err) {
            if (err) { return next(err); }
            res.redirect('/');
          });
        });
      });
    } else {
      db.get('SELECT rowid AS id, username, name FROM users WHERE rowid = ?', [ row.user_id ], function(err, row) {
        if (err) { return next(err); }
  
        // TODO: Handle undefined row.
        var user = {
          id: row.id.toString(),
          username: row.username,
          displayName: row.name
        };
        req.login(user, function(err) {
          if (err) { return next(err); }
          res.redirect('/');
        });
      });
    }
  });
}


var router = express.Router();

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.get('/login/federated/:provider',
  function(req, res, next) {
    var strategy = createStrategy(req.params.provider);
    passport.authenticate(strategy)(req, res, next);
  });

router.get('/oauth2/redirect/:provider',
  function(req, res, next) {
    var strategy = createStrategy(req.params.provider);
    passport.authenticate(strategy, { assignProperty: 'federatedUser', failureRedirect: '/login' })(req, res, next);
  },
  singleSignOn);

router.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

module.exports = router;
