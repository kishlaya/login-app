var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var config = require('config');

mongoose.connect(config.get('mongodb'));
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection Error: '));
db.once('open', function() {
	console.log("MongoDB connection established");
});

app.use(session({
	secret: 'work hard',
	resave: true,
	saveUninitialized: false,
	store: new MongoStore({
	mongooseConnection: db
	})
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'pug');

var router = require('./routes/router');
app.use('/', router);

app.use(function(req, res, next) {
	var err = new Error('Error 404');
  	err.status = 404;
  	next(err);
});

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  console.log(err);
  res.render('error', {message: err.message});
});

app.set('port', config.get('server.port'));
app.listen(app.get('port'), function() {
	console.log("Listening on " + app.get('port'));
});