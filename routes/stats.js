var vesper = require('../shared/vesper');
var httprequest = require('request');
var cachedStatsTable = null;
var lastFetchDate = null;

// GET

exports.get = function(request, response) {

  var shouldFetchStats = false;
  var cutOffDate = dateWithNumberOfMinutesInThePast(new Date(), 15);
  if (cutOffDate > lastFetchDate || !cachedStatsTable) {
    shouldFetchStats = true;
  }

  if (!shouldFetchStats) {
    response.render('stats', cachedStatsTable);
    return;
  }

  fetchStats(function(err, statusCode, statsTable) {

    if (err) {
      console.error(err);
      response.send(500);
      return;
    }
    if (statusCode !== 200) {
      response.send(500);
      return;
    }

    statsTable.notesPerUser = Math.round(statsTable.numberOfNotes / statsTable.numberOfAccounts);
    statsTable.tagsPerUser = Math.round(statsTable.numberOfTags / statsTable.numberOfAccounts);
    statsTable.photosPerUser = Math.round(statsTable.numberOfAttachments / statsTable.numberOfAccounts);

    statsTable.percentVerifiedAccounts = Math.round((statsTable.numberOfVerifiedAccounts / statsTable.numberOfAccounts) * 100);
    var updateDate = new Date(statsTable.updateDate);
    var updateDateString = dateString(updateDate);
    statsTable.updateDate = updateDateString;

    statsTable.title = 'Stats';
    cachedStatsTable = statsTable;
    lastFetchDate = new Date();

    response.render('stats', statsTable);
  });
}


function dateWithNumberOfMinutesInThePast(d, minutes) {
  var x = new Date(d);
  x.setUTCMinutes(d.getUTCMinutes() - minutes);
  return x;
}


function dateString(d) {

  var year = d.getUTCFullYear();
  var day = d.getUTCDate();
  var month = d.getUTCMonth();

  var monthString = 'Unknown month';

  switch (month) {
    case 0:
      monthString = 'January';
      break;
    case 1:
      monthString = 'February';
      break;
    case 2:
      monthString = 'March';
      break;
    case 3:
      monthString = 'April';
      break;
    case 4:
      monthString = 'May';
      break;
    case 5:
      monthString = 'June';
      break;
    case 6:
      monthString = 'July';
      break;
    case 7:
      monthString = 'August';
      break;
    case 8:
      monthString = 'September';
      break;
    case 9:
      monthString = 'October';
      break;
    case 10:
      monthString = 'November';
      break;
    case 11:
      monthString = 'December';
      break;
  }

  var hour = d.getUTCHours();
  var minutes = d.getUTCMinutes();

  return monthString + ' ' + day + ', ' + hour + ':' + minutes + ' ' + year + ' UTC';
}


// API Call

function fetchStats(callback) {

  var url = 'https://vesper.azure-mobile.net/api/stats';
  var vesperAPIKeyHeader = process.env.VESPER_API_KEY_HEADER;
  var vesperAPIKey = process.env.VESPER_API_KEY;

  var options = {
    uri: url,
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  };

  options.headers[vesperAPIKeyHeader] = vesperAPIKey;

  httprequest(options, function(err, response, body) {

    if (err) {
      callback(err);
      return;
    }

    callback(null, response.statusCode, JSON.parse(body));
  });
}