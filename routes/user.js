var vesper = require('../shared/vesper');
var httprequest = require('request');

// GET

exports.get = function(request, response) {

  var authentication = vesper.usernameAndPasswordFromRequest(request);
  if (!authentication) {
    respondWithAuthenticateHeader(response);
    return;
  }
  var username = authentication.username;
  var password = authentication.password;

  if (username !== 'cano-ichiro' || password !== process.env.SUPPORT_PASSWORD) {
    respondWithAuthenticateHeader(response);
    return;
  }

  var emailAddress = request.query.emailaddress;
  if (!emailAddress) {
    response.render('userlookup', {
      title: 'Account Lookup'
    });
    return;
  }

  fetchAccountInfo(emailAddress, function(err, statusCode, user) {

    if (err) {
      console.error(err);
      response.send(500);
      return;
    }

    if (statusCode === 204) {
      response.render('userlookup', {
        title: emailAddress + ' Not Found'
      });
      return;
    }

    if (statusCode != 200) {
      console.error('Unexpected status code response in user.js.');
      response.send(500);
      return;
    }

    var t = user;
    t.title = emailAddress;
    response.render('userlookupwithresults', t);
    return;
  });
}

function respondWithAuthenticateHeader(response) {

  response.set('WWW-Authenticate', 'Basic realm="Vesper"');
  response.send(401);
}

function fetchAccountInfo(emailAddress, callback) {

  var url = 'https://vesper.azure-mobile.net/api/accountinfo';
  var vesperAPIKeyHeader = process.env.VESPER_API_KEY_HEADER;
  var vesperAPIKey = process.env.VESPER_API_KEY;

  var options = {
    uri: url,
    method: 'POST',
    json: {
      emailAddress: emailAddress
    },
    headers: {
      'Authorization': 'Basic ' + new Buffer('qbranch:' + process.env.SUPPORT_KEY).toString('base64')
    }
  };
  options.headers[vesperAPIKeyHeader] = vesperAPIKey;
  httprequest(options, function(err, response, body) {

    if (err) {
      console.error(err);
      callback(err, null);
      return;
    }

    callback(null, response.statusCode, body);
  });
}