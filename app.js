//require dependencies
//server
var express = require('express');
var path = require('path');
var logger = require('morgan');
var exphbs  = require('express-handlebars');
//cookie
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var MongoStore = require('connect-mongo')(session);
//access to routes
// var routes = require('./routes/index');
var mongoose = require('mongoose');

//mongodb stuff here
// mongoose.connection.on('connected', function() {
//   console.log('Success: connected to MongoDb!');
// });
// mongoose.connection.on('error', function() {
//   console.log('Error connecting to MongoDb. Check MONGODB_URI in env.sh');
//   process.exit(1);
// });
// mongoose.connect(process.env.MONGODB_URI_TEST);


//start express server
var app = express();

// view engine setup
app.engine('.hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', '.hbs');

//express validator
var expressValidator = require('express-validator');
app.use(expressValidator());


//required middleware
//body and cookie parsers
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


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

// All of our routes are in routes.js
var routes = require('./routes');
app.use('/', routes);

console.log('Express started. Listening on port', process.env.PORT || 3000);
app.listen(process.env.PORT || 3000);
