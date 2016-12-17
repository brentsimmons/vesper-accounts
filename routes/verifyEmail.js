var vesper = require('../shared/vesper');
var httprequest = require('request');
var TEST_TOKEN = 'test';
var TEST_TOKEN_ERROR = 'testerror';

// GET

exports.get = function(request, response) {

  try {
    var token = request.params.token;
    if (!token) {
      response.send(400);
      return;
    }

    var testing = (token === TEST_TOKEN);
    if (testing) {
      response.render('verifyEmail', {
        emailAddress: 'testing@example.com',
        title: 'Email Verified'
      });
      return;
    }

    var testingError = (token == TEST_TOKEN_ERROR);
    if (testingError) {
      response.render('verifyEmailError');
      return;
    }
  }

  catch (err) {
    response.render('verifyEmailError');
  }

  verifyUserWithToken(token, function(err, statusCode, emailAddress) {

    try {
      if (err || statusCode >= 300) {
        response.render('verifyEmailError');
        return;
      }


      response.render('verifyEmail', {
        emailAddress: emailAddress,
        title: 'Email Verified'
      });
      return;
    }

    catch (err) {
      response.render('verifyEmailError');
    }
  });
}


// API Call

function verifyUserWithToken(token, callback) {

  var url = process.env.VERIFY_EMAIL_URL;
  var secretKey = process.env.VERIFY_EMAIL_API_KEY;
  var vesperAPIKeyHeader = process.env.VESPER_API_KEY_HEADER;
  var vesperAPIKey = process.env.VESPER_API_KEY;

  var options = {
    uri: url,
    method: 'POST',
    json: {
      token: token
    },
    headers: {
      verifyemailapikey: secretKey,
    }
  };
  options.headers[vesperAPIKeyHeader] = vesperAPIKey;

  httprequest(options, function(err, response, body) {

    if (err) {
      console.error(err);
      callback(err, null);
      return;
    }

    callback(null, response.statusCode, body.emailAddress);
  });
}