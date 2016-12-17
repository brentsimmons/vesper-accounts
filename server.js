
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.locals.pretty = true;
    
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.bodyParser());
app.use(express.json());
app.use(express.urlencoded());

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var forgotPassword = require('./routes/forgotpassword');
app.get('/forgotpassword/:token', forgotPassword.get);

var resetPassword = require('./routes/resetpassword');
app.post('/resetpassword', resetPassword.post);

var verifyEmail = require('./routes/verifyEmail');
app.get('/verify/:token', verifyEmail.get);

var stats = require('./routes/stats');
app.get('/stats', stats.get);

var userLookup = require('./routes/user');
app.get('/user', userLookup.get);

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
