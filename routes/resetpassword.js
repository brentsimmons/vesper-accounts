// Validation error codes. Don't change -- they're also used in client-side code.

var PASSWORDS_OK = 0;
var PASSWORDS_MUST_MATCH = 1;
var PASSWORD_TOO_SHORT = 2;
var TEST_TOKEN = 'test';

// POST

exports.post = function(request, response) {

  var vesper = require('../shared/vesper');

  try {
    var resetPasswordToken = request.body.resetPasswordToken;
    if (!resetPasswordToken) {
      response.render('expiredToken');
      return;
    }

    var p1 = request.body.password1;
    var p2 = request.body.password2;

    var errorCode = validatePasswords(p1, p2);
    if (errorCode !== PASSWORDS_OK) {
      redirectToForgotPageWithErrorCode(errorCode, resetPasswordToken, response);
      return;
    }

    var testing = (resetPasswordToken === TEST_TOKEN);
    if (testing) {
      response.render('resetpassword', {
        title: 'Password Changed'
      });
      return;
    }

    if (vesper.tokenWasUsed(resetPasswordToken)) {
      response.render('expiredToken');
      return;
    }

    var tokenInfo = vesper.decryptedTokenInfo(resetPasswordToken);
    if (tokenInfo === null || vesper.tokenIsExpired(tokenInfo)) {
      response.render('expiredToken');
      return;
    }

    var username = tokenInfo.username;
    if (!username) {
      response.render('expiredToken');
      return;
    }
    username = username.toLowerCase();
  }
  catch (err) {
    vesper.handleError(response, err);
    return;
  }

  vesper.resetPassword(username, p1, resetPasswordToken, function(err, statusCode) {

    if (err) {
      vesper.handleError(response, err);
      return;
    }

    vesper.addUsedToken(resetPasswordToken);

    try {
      if (statusCode === 410 || statusCode === 401) {
        response.render('expiredToken');
      }

      else if (statusCode === 204) {
        response.render('resetpassword', {
          title: 'Password Changed'
        });
      }

      else {
        response.send(500);
      }
    }
    catch (err) {
      vesper.handleError(response, err);
      return;
    }
  });
}

// Utilities

function redirectToForgotPageWithErrorCode(errorCode, resetPasswordToken, response) {

  var url = '/forgotpassword/' + resetPasswordToken + '?errorCode=' + errorCode;
  response.redirect(url);
}

function validatePasswords(p1, p2) {

  if (!p1 || !p2 || p1.length < 7 || p2.length < 7) {
    return PASSWORD_TOO_SHORT;
  }

  if (p1 !== p2) {
    return PASSWORDS_MUST_MATCH;
  }

  return PASSWORDS_OK;
}