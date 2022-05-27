var express = require('express');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oidc');
var idp = require('../idp');
var db = require('../db');


passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/oauth2/redirect/google',
  scope: [ 'profile' ]
}, function verify(issuer, profile, cb) {
  db.get('SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?', [
    issuer,
    profile.id
  ], function(err, row) {
    if (err) { return cb(err); }
    if (!row) {
      db.run('INSERT INTO users (name) VALUES (?)', [
        profile.displayName
      ], function(err) {
        if (err) { return cb(err); }
        var id = this.lastID;
        db.run('INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)', [
          id,
          issuer,
          profile.id
        ], function(err) {
          if (err) { return cb(err); }
          var user = {
            id: id,
            name: profile.displayName
          };
          return cb(null, user);
        });
      });
    } else {
      db.get('SELECT * FROM users WHERE id = ?', [ row.user_id ], function(err, row) {
        if (err) { return cb(err); }
        if (!row) { return cb(null, false); }
        return cb(null, row);
      });
    }
  });
}));

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});


function singleSignOn(req, res, next) {
  // TODO: need to set at req.federatedAuthInfo;
  var state = req.authInfo.state || {};
  var action = state.action || 'login';
  
  if (action !== 'login') { return next(); }
  
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

function accountLink(req, res, next) {
  console.log('ACCOUNT LINK!');
  console.log(req.user);
  console.log(req.federatedUser);
  console.log(req.authInfo);
  
  
  // TODO: need to set at req.federatedAuthInfo;
  var state = req.authInfo.state || {};
  var action = state.action;
  
  if (action !== 'link') { return next(); }
  
  // TODO: Check that state user is req user.
  
  db.run('INSERT INTO federated_credentials (provider, subject, user_id) VALUES (?, ?, ?)', [
    'https://' + req.params.provider,
    req.federatedUser.id,
    req.user.id
  ], function(err) {
    if (err) { return next(err); }
    res.redirect(state.returnTo || '/');
  });
}


var router = express.Router();

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.get('/login/federated/google', passport.authenticate('google'));

router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/login'
}));
  
router.get('/oauth/callback/:provider',
  function(req, res, next) {
    var strategy = idp.create(req.params.provider);
    passport.authenticate(strategy, { assignProperty: 'federatedUser', failureRedirect: '/login' })(req, res, next);
  },
  singleSignOn,
  accountLink);

router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

module.exports = router;
