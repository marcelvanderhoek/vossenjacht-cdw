var express = require('express');
var passport = require('passport');
var dashboard = express.Router();
const bodyParser = require('body-parser');
dashboard.use(bodyParser.urlencoded({ extended: false }));

var Log = require(__dirname + '/../models/logboek');
var Vos = require(__dirname + '/../models/vos');
var Groep = require(__dirname + '/../models/groep');
var Vangst = require(__dirname + '/../models/vangst');
var Instelling = require(__dirname + '/../models/instelling');
var Account = require(__dirname + '/../models/account');

function isIngelogd(req, res, next) {
	if(req.isAuthenticated()) { 
		res.locals.user = req.user;
		return next(); 
	}
	res.redirect('/vossenjacht/dash/login');
}

dashboard.get('/', isIngelogd, function(req, res) {

	Log.find({}, null, {sort: {tijd: -1}}).limit(10).lean().exec(function(err, entries) {
		if(err) {
			res.end('Error'); 
		} else {
			res.locals.logboek = entries;
			res.render('dashboard/index');
		}
	});
});

dashboard.post('/registreer', function(req, res, next) {
    Account.register(new Account({ username: req.body.gebruikersnaam }), req.body.wachtwoord, function(err, account) {
        if (err) {
        	return res.json(err.message);
        }

        passport.authenticate('local')(req, res, function() {
        	req.session.save(function(err) {
        		if(err) {
        			return next(err);
        		}
	            res.json({ bericht: 'succes' });
        	});
        });
    });
});

dashboard.get('/login', function(req, res) {
    res.render('dashboard/login');
});

dashboard.post('/login', passport.authenticate('local', { successRedirect: './', failureRedirect: './login' }), function(req, res) {
    res.redirect('/vossenjacht/dash/');
});

dashboard.get('/logout', function(req, res) {
    req.session.destroy();
    req.logout();
    res.redirect('/vossenjacht/dash/login');
});

dashboard.get('/ping', function(req, res){
    res.status(200).send("pong!");
});

dashboard.get('/vossen', isIngelogd, function(req, res) {
	Vos.find({}, null, {sort: {nummer: 1}}).lean().exec(function(err, vossen) {
		if(err) {
			res.end('Error'); 
		} else {
			res.locals.vossen = vossen;
			res.render('dashboard/vossen');
		}
	});	
});

dashboard.get('/vangsten', isIngelogd, function(req, res) {
	Vangst.find().lean().exec(function(err, vangsten) {
		if(err) {
			res.json('Error');
		} else {
			res.locals.vangsten = vangsten;
			res.render('dashboard/vangsten');
		}
	});
});

dashboard.get('/groepen', isIngelogd, function(req, res) {
	Groep.find({}, null, {sort: {vangsten: -1}}).lean().exec(function(err, groepen) {
		if(err) {
			res.end(err);
		} else {
			var rank = 1;
			groepen.forEach( function (groep) {
			    groep.rank = rank;
			    rank++;
			});
			res.locals.groepen = groepen;
			res.render('dashboard/groepen');
		}
	});
});

dashboard.get('/instellingen', isIngelogd, function(req, res) {
	Instelling.find({ instelling: 'eindtijd' }).limit(1).lean().exec(function(err, instellingen) {
		if(err) {
			console.log(err);
		} else if (Object.keys(instellingen).length === 0) {
			// leeg, instelling aanmaken met default waarde
			var nieuweInstelling = new Instelling({
				instelling: 'eindtijd',
				waarde: '17:00'
			}); 
			
			nieuweInstelling.save(function(err) {
				if(err) {
				} else {
					res.locals.eindtijd = '17:00';
					res.render('dashboard/instellingen');
				}
			});
		} else {
			res.locals.eindtijd = instellingen[0].waarde;
			res.render('dashboard/instellingen');
		}
	});
});

module.exports = dashboard;