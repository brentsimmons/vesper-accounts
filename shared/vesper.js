var httprequest = require('request');
var usedTokens = [];

// Exports

exports.handleError = handleError;
exports.tokenIsExpired = tokenIsExpired;
exports.decryptedTokenInfo = decryptedTokenInfo;
exports.resetPassword = resetPassword;
exports.tokenWasUsed = tokenWasUsed;
exports.addUsedToken = addUsedToken;
exports.usernameAndPasswordFromRequest = usernameAndPasswordFromRequest;

// Errors

function handleError(response, err) {
  if (err) {
    console.error(err, err.stack);
  }
  response.send(500);
}


// Authentication

function base64Decode(s) {
  return new Buffer(s, 'base64').toString('utf8');
}

function usernameAndPasswordFromRequest(request) {

  var rawHeader = request.headers.authorization;
  return usernameAndPasswordFromHeader(rawHeader);
}

function usernameAndPasswordFromHeader(header) {

  if (!header || header.length < 1) {
    return null;
  }

  var token = header.split(/\s+/).pop();
  var decodedString = base64Decode(token);
  var components = decodedString.split(':');

  var username = components[0];
  username = username.toLowerCase();
  return {
    username: username,
    password: components[1]
  };
}


// Tokens

function tokenWasUsed(token) {

  return usedTokens.indexOf(token) >= 0;
}


function addUsedToken(token) {

  usedTokens.push(token);
}


function tokenIsExpired(tokenInfo) {

  var now = new Date();
  if (tokenInfo.expirationDate < new Date()) {
    return true;
  }

  // Sanity check. If the date expires 2 or more hours in the future,
  // then it's bogus and we pretend it's expired.

  var futureDate = new Date();
  futureDate.setUTCHours(now.getUTCHours() + 2);
  if (tokenInfo.expirationDate > futureDate) {
    return true;
  }

  return false;
}

function decryptedTokenInfo(resetPasswordToken) {

  // Some base64 characters have been replaced with URL-friendly alternates.

  resetPasswordToken = resetPasswordToken.replace(/\*/g, '\/');
  resetPasswordToken = resetPasswordToken.replace(/\./g, '+');
  resetPasswordToken = resetPasswordToken.replace(/-/g, '=');

  var plainText = decryptText(resetPasswordToken, process.env.RESET_TOKEN_ENCRYPTION_KEY);
  if (!plainText) {
    return null;
  }

  var components = plainText.split(':');
  if (!components || components.length != 3) {
    return null;
  }

  var salt = components[1];
  if (salt !== process.env.RESET_TOKEN_SALT) {
    return null;
  }

  var tokenInfo = {};

  tokenInfo.username = components[2];

  var expirationDateValue = parseInt(components[0]); // 10-digit timestamp
  tokenInfo.expirationDate = new Date(expirationDateValue * 1000);

  return tokenInfo;
}

function decryptText(s, key) {

  var crypto = require('crypto');
  var decipher = crypto.createDecipher('aes256', key);
  var output = decipher.update(s, 'base64', 'binary');
  output += decipher.final('binary');

  output = new Buffer(output, 'binary').toString('utf-8');

  return output;
}

// API Call

function resetPassword(username, password, resetPasswordToken, callback) {

  var url = process.env.RESET_TOKEN_CHANGE_PASSWORD_URL;
  var secretKey = process.env.RESET_TOKEN_KEY;
  var vesperAPIKeyHeader = process.env.VESPER_API_KEY_HEADER;
  var vesperAPIKey = process.env.VESPER_API_KEY;

  var options = {
    uri: url,
    method: 'POST',
    json: {
      username: username,
      password: password,
      resetPasswordToken: resetPasswordToken
    },
    headers: {
      resettokenkey: secretKey
    }
  };
  options.headers[vesperAPIKeyHeader] = vesperAPIKey;

  httprequest(options, function(err, response, body) {

    if (err) {
      callback(err, null);
      return;
    }

    callback(null, response.statusCode);
  });
}