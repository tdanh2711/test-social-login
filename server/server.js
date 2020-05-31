// Copyright IBM Corp. 2016,2019. All Rights Reserved.
// Node module: loopback-workspace
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const loopback = require('loopback');
const boot = require('loopback-boot');

const app = module.exports = loopback();
const session = require('express-session');
const bodyParser = require('body-parser');

const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

app.use(session({secret: 'cats'}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  const User = app.models.user;
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

function passportSocialLoginCallback(accessToken, refreshToken, profile, done) {
  const User = app.models.user;

  const provider = profile.provider;
  const email = profile.emails[0].value;
  const {givenName, middleName, familyName} = profile.name;
  const name = [givenName, middleName, familyName].filter(s => !!s).join(' ');
  const avatar = profile.photos[0].value;

  // Find user with this email
  User.findOne({where: {email}}, (err, user) => {
    if (err) return done(err);

    if (user) {
      // User already existed --> Update info from Fb/Gg
      if (provider === 'facebook') {
        user.nameFb = name;
        user.avatarFb = avatar;
      } else if (provider === 'google') {
        user.nameGg = name;
        user.avatarGg = avatar;
      }
      user.save((err, user) => done(err, user));
    } else {
      // New user --> create
      if (provider === 'facebook') {
        User.create(
          {email, nameFb: name, avatarFb: avatar},
          (err, user) => done(err, user)
        );
      } else if (provider === 'google') {
        User.create(
          {email, nameGg: name, avatarGg: avatar},
          (err, user) => done(err, user)
        );
      }
    }
  });
}

passport.use(
  new FacebookStrategy({
    clientID: '259912551918103',
    clientSecret: 'c07dc77cffacba7166a5ed5edf2dd7a4',
    callbackURL: 'https://test-social-login.herokuapp.com/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
  },
  passportSocialLoginCallback
));

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email'}));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get(
  '/auth/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/login.html',
  })
);

passport.use(
  new GoogleStrategy({
    clientID: '382153998443-5fi45g405303nc75p4c0ppuu153hchp1.apps.googleusercontent.com',
    clientSecret: 'G1YhGdyLfrtkn7XRVIJpiG8G',
    callbackURL: 'https://test-social-login.herokuapp.com/auth/google/callback',
  },
  passportSocialLoginCallback
));

app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: [
      'https://www.googleapis.com/auth/plus.login',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login.html',
  })
);

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/login.html');
});

app.get('/', function(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/login.html');
  }
});

app.get('/index.html', function(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/login.html');
  }
});

app.get('/login.html', function(req, res, next) {
  if (!req.user) {
    next();
  } else {
    res.redirect('/index.html');
  }
});

// Route for get current logged in user
app.get('/activeUser', function(req, res) {
  if (req.user) {
    res.setHeader('Content-Type', 'application/json');
    res.json(req.user);
  } else {
    res.end('Not logged in');
  }
});

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    const baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      const explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
