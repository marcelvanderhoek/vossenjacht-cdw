const instellingen = require(__dirname + '/instellingen.js');

// PM2 http logging
const pmx = require('pmx').init({ 
	http: true,
	network: true,
	ports: true
});

// includes
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const logger = require('morgan');
const compression = require('compression');
const path = require('path');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express();
const io = require('socket.io').listen(app.listen(3000));

const publicPath = path.resolve(__dirname + '/public');

const accessLogStream = fs.createWriteStream(__dirname + '/log/requests.log', { flags: 'a' });

if (app.get('env') == 'production') {
	app.use(logger('common', { 
		skip: function(req, res) { 
			return res.statusCode < 400; 
		}, 
		stream: accessLogStream 
	}));
} else {
	app.use(logger('dev'));
}

app.use('/vossenjacht', express.static(publicPath));

io.sockets.on('connection', function (socket) {
});

// Verbinden met database
mongoose.connect(instellingen.mongo.production.connectionString, instellingen.mongo.opts);
mongoose.Promise = global.Promise;

// Routers
const apiRouter = require(__dirname + '/routes/api_router');
const frontEndRouter = require(__dirname + '/routes/frontend_router');
const dashboardRouter = require(__dirname + '/routes/dashboard_router');

// Views in ejs
app.set('views', path.resolve(__dirname + '/views'));
app.set('view engine', 'ejs');

app.use(compression()); // gzip
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
	secret: instellingen.cookieSecret,
	name: 'vossenjacht',
	store: new MongoStore({
		mongooseConnection: mongoose.connection,
		ttl: 14 * 24 * 60 * 60
	}),
	resave: false,
	saveUninitialized: false,
	cookie: {
		expires: new Date(Date.now() + 3600000 * 24 * 14) // 2 weken
	}
}));
app.use(passport.initialize());
app.use(passport.session());

//passport config
var Account = require('./models/account');
passport.use(new LocalStrategy({usernameField:'gebruikersnaam', passwordField:'wachtwoord'}, Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

app.use(function(req, res, next) {
	var groep = req.session.groep;
	if(!groep) {
		groep = req.session.groep = {};
	}
	req.io = io;
	next();
});

// Statische bestanden zijn te vinden in /public
app.use('/vossenjacht', frontEndRouter);
app.use('/vossenjacht/api', apiRouter);
app.use('/vossenjacht/dash', dashboardRouter);

app.use(function(req, res) {
	// niet bestaande route
	res.status(404).send('404.');
});

app.use(function(err, req, res, next) {
	console.log(err);
	res.status(500);
	res.send('Interne serverfout.');
});