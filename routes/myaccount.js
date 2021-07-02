var express = require('express');
var csrf = require('csurf');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var passport = require('passport');
var idp = require('../idp');
var db = require('../db');

var router = express.Router();

/* GET my account page. */
// This route shows account information of the logged in user.  The route is
// guarded by middleware that ensures a user is logged in.  If not, the web
// browser will be redirected to `/login`.
router.get('/', ensureLoggedIn(), function(req, res, next) {
  res.render('myaccount', { user: req.user });
});

router.get('/connected',
  csrf(),
  ensureLoggedIn(),
  function(req, res, next) {
    db.all('SELECT rowid as id, * FROM federated_credentials WHERE user_id = ?', [ req.user.id ], function(err, rows) {
      if (err) { return next(err); }
      
      rows.forEach(function(row) {
        var acct = {
          id: row.id,
          provider: row.provider,
          subject: row.subject
        };
        
        switch (row.provider) {
        case 'https://accounts.google.com':
          res.locals.googleAccount = acct;
          break;
        case 'https://www.facebook.com':
          res.locals.facebookAccount = acct;
          break;
        case 'https://twitter.com':
          res.locals.twitterAccount = acct;
          break;
        }
      });
      next();
    });
  },
  function(req, res, next) {
    res.render('myaccount/connected', { user: req.user, csrfToken: req.csrfToken() });
  });

router.post('/link',
  csrf(),
  ensureLoggedIn(),
  function(req, res, next) {
    var state = {
      action: 'link'
    };
    var strategy = idp.create(req.body.provider);
    passport.authenticate(strategy, { state: state })(req, res, next);
  });

  // TODO: Authorize this based on user_id
router.post('/delete',
  csrf(),
  ensureLoggedIn(),
  function(req, res, next) {
    db.run('DELETE FROM federated_credentials WHERE rowid = ?', [ req.body.id ], function(err) {
      if (err) { return next(err); }
      return res.redirect('/myaccount/connected')
    });
  });

module.exports = router;
