var express = require('express');
var api = express.Router();

// Schema's
var Vos = require(__dirname + '/../models/vos');
var Vangst = require(__dirname + '/../models/vangst');
var Groep = require(__dirname + '/../models/groep');
var Instelling = require(__dirname + '/../models/instelling');

api.get('/', function(req, res) {
	res.render('api/index');
});

api.get('/vangsten', function(req, res) {
	Vangst.find().lean().exec(function(err, vangsten) {
		if(err) {
			res.json('Error');
		} else {
			res.json(vangsten);
		}
	});
});

api.get('/vangsten/groep/:groep', function(req, res) {
	var groep = req.params.groep;
	Vangst.find({ groepId: groep }).lean().exec(function(err, vangsten) {
		if(err) {
			console.log(err);
			res.json('Error'); 
		} else {
			res.json(vangsten);
		}
	});
});

api.get('/vangsten/vos/:vos', function(req, res) {
	var vos = req.params.vos;
	Vangst.find({ vosId: vos }).lean().exec(function(err, vossen) {
		if(err) {
			res.json('Error');
		} else {
			res.json(vossen);
		}
	});
});

api.get('/vangsten/laatste', function(req, res) {
	Vangst.findOne({}, null, {sort: {tijd: -1}}).lean().exec(function(err, vangsten){
		if(err) {
			res.json('Error');
		} else {
			res.json(vangsten);
		}

	});
});

api.get('/vossen', function(req, res) {
	Vos.find({}, null, {sort: {nummer: 1}}).lean().exec(function(err, vossen) {
		if(err) {
			res.json('Error'); 
		} else {
			res.json(vossen);
		}
	});
});

api.post('/vos/maak', function(req, res) {
	var nieuweVos = new Vos({
		naam: req.body.naam,
		nummer: req.body.nummer,
		beschrijving: req.body.beschrijving,
		locatieLong: req.body.locatieLong,
		locatieLat: req.body.locatieLat
	}); 
	nieuweVos.save(function(err) {
		if(err) {
			res.json('Error');
		} else {
			res.json('Nieuwe vos opgeslagen!');
		}
	});
});

api.get('/vos/verwijder/:id', function(req,res) {
	Vos.remove({
		_id: req.params.id
	}, function(err, vos) {
		if(err) {
			res.json('Error');
		} else {
			res.json({ 'Vos verwijderd: ' : req.params.id});
		}
	});
});

api.get('/groepen', function(req, res) {
	Groep.find().lean().exec(function(err, groepen) {
		if(err) {
			res.json('Error'); 
		} else {
			res.json(groepen);
		}
	});
});

api.get('/stand', function(req, res) {
	Groep.find({}, null, {sort: {vangsten: -1}}).lean().exec(function(err, groepen) {
		if(err) {
			res.json(err);
		} else {
			var rank = 1;
			groepen.forEach( function (groep) {
			    groep.rank = rank;
			    rank++;
			});
			res.json(groepen);
		}
	});
});

api.post('/instelling/update', function(req, res) {
	Instelling.update({ instelling: 'eindtijd' }, { $set: { waarde: req.body.eindtijd }}, function(err, instelling) {
		if(err) {
			console.log(err);
		}
	});
});

module.exports = api;