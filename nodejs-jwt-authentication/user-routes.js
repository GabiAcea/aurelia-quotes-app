var express = require('express'),
    _       = require('lodash'),
    config  = require('./config'),
    jwt     = require('jsonwebtoken');

var app = module.exports = express.Router();

// XXX: This should be a database of users :).
var users = [{
  id: 1,
  username: 'gonto',
  password: 'gonto'
}];

function createIdToken(user) {
  return jwt.sign(_.omit(user, 'password'), config.secret, { expiresIn: 60*60*5 });
}

function createAccessToken() {
  return jwt.sign({
    iss: config.issuer,
    aud: config.audience,
    exp: Math.floor(Date.now() / 1000) + (60 * 60),
    scope: 'full_access',
    sub: "lalaland|gonto",
    jti: genJti(), // unique identifier for the token
    alg: 'HS256'
  }, config.secret);
}

// Generate Unique Identifier for the access token
function genJti() {
  let jti = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 16; i++) {
      jti += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return jti;
}

function getUserScheme(req) {

  var username;
  var type;
  var userSearch = {};

  // The POST contains a username and not an email
  if(req.body.username) {
    username = req.body.username;
    type = 'username';
    userSearch = { username: username };
  }
  // The POST contains an email and not an username
  else if(req.body.email) {
    username = req.body.email;
    type = 'email';
    userSearch = { email: username };
  }

  return {
    username: username,
    type: type,
    userSearch: userSearch
  }
}
/// start sentry config/init
var Sentry = require('@sentry/node') ;

Sentry.init({ dsn:'https://8fe8013870a7487d868f8d0ae58eab94:4dea3953f88c4073b7708a54829d6882@sentry.io/1299831' });

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

app.get('/withCaptureMessage', function mainHandler(req, res) {
    var value = 3.14;

    if (value < 4) {
        Sentry.captureMessage('Error caught with captureMessage test!!!');

        return res.status(400).send("Poc");
    } else {
        return res.status(200).send("Cioroi norocos");
    }
});

app.get('/tryCatch', function mainHandler(req, res) {
    var obj = {
        posOne: "somethingsHere"
    };

    try {
        notExistingFunction();

        return res.status(200).send("!@#$%^^&*()_+");
    } catch (err) {
        Sentry.captureException(err);

        return res.status(400).send("Poc");
    }
});

app.get('/throw', function mainHandler(req, res) {
    throw new Error('Throw error! Test!');
});

// The error handler must be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + '\n');
});
/// end sentry config/init

app.post('/users', function(req, res) {

  var userScheme = getUserScheme(req);

  if (!userScheme.username || !req.body.password) {
    return res.status(400).send("You must send the username and the password");
  }

  if (_.find(users, userScheme.userSearch)) {
   return res.status(400).send("A user with that username already exists");
  }

  var profile = _.pick(req.body, userScheme.type, 'password', 'extra');
  profile.id = _.max(users, 'id').id + 1;

  users.push(profile);

  res.status(201).send({
    id_token: createIdToken(profile),
    access_token: createAccessToken()
  });
});

app.post('/sessions/create', function(req, res) {

  var userScheme = getUserScheme(req);

  if (!userScheme.username || !req.body.password) {
    return res.status(400).send("You must send the username and the password");
  }

  var user = _.find(users, userScheme.userSearch);

  if (!user) {
    return res.status(401).send("The username or password don't match");
  }

  if (user.password !== req.body.password) {
    return res.status(401).send("The username or password don't match");
  }

  res.status(201).send({
    id_token: createIdToken(user),
    access_token: createAccessToken()
  });
});
