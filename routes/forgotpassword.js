var vesper = require('../shared/vesper');
var TEST_TOKEN = 'test';

var PASSWORDS_MUST_MATCH = 1;
var PASSWORD_TOO_SHORT = 2;

// GET

exports.get = function(request, response) {

  // Display expired message even for invalid tokens, since
  // we don't want to provide attackers any information
  // about what a valid token looks like.

  try {
    var resetPasswordToken = request.params.token;
    if (!resetPasswordToken) {
      response.send(400);
      return;
    }

    // Reset-password page redirects back to here with errorCode
    // query arg if it couldn't validate passwords.
    // This is done in case the browser has turned off JavaScript.

    var errorMessage = null;

    if (request.query.errorCode) {
      errorCode = parseInt(request.query.errorCode);
      if (errorCode === PASSWORDS_MUST_MATCH) {
        errorMessage = 'Passwords must match.';
      }
      else if (errorCode === PASSWORD_TOO_SHORT) {
        errorMessage = 'Password must be at least 7 characters long.';
      }
    }

    var testing = (resetPasswordToken === TEST_TOKEN);
    if (testing) {
      response.render('forgotpassword', {
        title: 'Reset Password',
        username: 'testing@example.com',
        resetPasswordToken: resetPasswordToken,
        errorMessage: errorMessage
      });
      return;
    }

    if (vesper.tokenWasUsed(resetPasswordToken)) {
      response.render('expiredToken');
      return;
    }
    
    var tokenInfo = vesper.decryptedTokenInfo(resetPasswordToken);
    if (!tokenInfo || vesper.tokenIsExpired(tokenInfo)) {
      response.render('expiredToken');
      return;
    }
    if (!tokenInfo.username) {
      response.render('expiredToken');
      return;
    }

    response.render('forgotpassword', {
      title: 'Reset Password',
      username: tokenInfo.username,
      resetPasswordToken: resetPasswordToken,
      errorMessage: errorMessage
    });
  }
  catch (err) {
    response.render('expiredToken');
  }
}