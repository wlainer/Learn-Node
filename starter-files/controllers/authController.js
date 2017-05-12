const passport = require('passport');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlask: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
});