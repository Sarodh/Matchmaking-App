// Application essentials
var express = require('express');
var mLogger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var GoogleAuth = require ('./services/GoogleIdValidation'); 
var wlog = require('./services/wLogger.js');
var ccs = require('./services/gcmXmpp.js');

var dbServer = process.env.PRODUCTION ? process.env.PRODUCTION_URL : "mongodb://"+process.env.IP+"/who";

// Configure and connect to DB
mongoose.connect(dbServer , function(err) {
    if(err) {
        wlog.error(err);
    } else {
        wlog.info("Connected to Mongodb");
    }
});

mongoose.set('debug', true);

ccs.connectXmpp();

var app = express();

// Middlewares
app.use(mLogger('dev'));
app.use(bodyParser.json({limit: "50mb", parameterLimit: 10000}));
app.use(bodyParser.urlencoded({ extended: false, limit: "50mb", parameterLimit: 10000}));
// Binary stream upload handler 
app.use(function(req, res, next) {
    var contentType = req.headers['content-type'] || '';
    var mime = contentType.split(';')[0];
    // Only use this middleware when content-type is application/octet-stream 
    if(mime != 'application/octet-stream') 
        return next();
    var data = '';
    req.setEncoding('binary');
    req.on('data', function(chunk) { 
        data += chunk;
    });
    req.on('end', function() {
        req.rawBody = data;
        next();
   });
});


// Declare routes
var index = require('./routes/index');
var update = require('./routes/update');
var livefeed = require('./routes/livefeed');
var matchmaking = require('./routes/matchmaking');
var upload = require('./routes/upload');
var cancel = require('./routes/cancelMM');
var leaveRoom = require('./routes/leaveRoom');
var liveStatus = require('./routes/livestatus');
var initial = require('./routes/initial');
var liveFeedMatch = require('./routes/livefeedMatch');
var blockuser = require('./routes/blockuser');

app.get('/', index);
app.post('/update', GoogleAuth.isAuthenticated ,update);
app.post('/findmatch',GoogleAuth.isAuthenticated, matchmaking);
app.post('/livefeed', GoogleAuth.isAuthenticated, livefeed);
app.post('/upload', GoogleAuth.isAuthenticated, upload);
app.post('/cancelMM', GoogleAuth.isAuthenticated, cancel);
app.post('/leaveRoom', GoogleAuth.isAuthenticated, leaveRoom);
app.post('/livestatus', GoogleAuth.isAuthenticated, liveStatus);
app.post('/initial', GoogleAuth.isAuthenticated, initial);
app.post('/livefeedmatch', GoogleAuth.isAuthenticated, liveFeedMatch);
app.post('/blockuser', GoogleAuth.isAuthenticated, blockuser);


// 404 request error handler
app.use(function(req, res, next) {
 var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500).json({error: err.message}).end();
  });
}

module.exports = app;
