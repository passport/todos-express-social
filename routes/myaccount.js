var express = require('express');
var csrf = require('csurf');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var passport = require('passport');
var idp = require('../lib/idp');

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

module.exports = router;
