var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var db = require('./models/db');
var messagesModel = require('./models/messages.js');

var routes = require('./routes/index');
var messagesController = require('./routes/messages');

//Create server
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//Use middleware
app.use(bodyParser());
app.use(pizzaDebug);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/frameworks', express.static(__dirname + '/node_modules/bootstrap/dist/'));

function pizzaDebug (req,res,next) {
  
  if (req.query.debug === 'pizza') {
    return res.send('i like pizza');
  }
  
  next();
}

app.use('/', routes);
app.use('/messages', messagesController);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
