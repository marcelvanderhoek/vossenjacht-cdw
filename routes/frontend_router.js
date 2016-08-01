var express = require('express');
var frontEnd = express.Router();
var async = require('async');

// Schema's
var Vos = require(__dirname + '/../models/vos');
var Vangst = require(__dirname + '/../models/vangst');
var Groep = require(__dirname + '/../models/groep');
var Log = require(__dirname + '/../models/logboek');
var Instelling = require(__dirname + '/../models/instelling');

function maakLogEntry(bericht) {
	var nieuweLogEntry = new Log({
		bericht: bericht
	});			
	nieuweLogEntry.save(function(err, resultaat) {
		if(err) {
			// Faalt stilletjes, maakt niet zoveel uit
		}
	});
}

function verstuurBericht(bericht, req) {
	req.io.sockets.emit('update', bericht);
	maakLogEntry(bericht);
}

function findById(groepen, nummer) {
	for (var i = 0; i < groepen.length; i++) {
		if (groepen[i].nummer === nummer) {
			return groepen[i];
		}
	}
}

frontEnd.use(function(req, res, next) {
	// het bericht uit de sessie naar de response halen en vervolgens weggooien, zodat deze alleen weergeven wordt in huidige response
	res.locals.bericht = req.session.bericht;
	delete req.session.bericht;
	next();
});

frontEnd.get('/', function(req, res) {
	// Eerst ff kijken of deze gebruiker wel geregistreerd is
	if (Object.keys(req.session.groep).length === 0 && req.session.groep.constructor === Object) {
		res.end('Nog niet geregistreerd...');
	} 
	else {
		async.waterfall([
		    function(callback) {
		    	// Dit object wordt gevuld met data voor weergave op de frontpage
		    	var data = { 
		    		groep: 0,
		    		vossenGescand: 0,
		    		vossenTotaal: 0,
		    		plaats: 0,
		    		tijdResterend: 0
		    	};
		    	// Alle groepen zoeken, sorteren op aantal vangsten
		    	Groep.find({}, null, {sort: {vangsten: -1}}).lean().exec(function(err, groepen) {
		    		if(err) {
		    			callback(true, err);
		    		} else {
				    	var nummer = Number(req.session.groep);
						var dezeGroep = findById(groepen, nummer);
						data.groep = nummer;
						data.vossenGescand = dezeGroep.vangsten;
		    			callback(null, data, groepen, dezeGroep);
		    		}
		    	});
		    },
		    // Ranking toevoegen
		    function(data, groepen, dezeGroep, callback) {
				var rank = 1;
				groepen.forEach(function(groep) {
				    groep.rank = rank;
				    rank++;
				});
				data.plaats = dezeGroep.rank;
				callback(null, data, groepen);
		    },
		    // Aantal vossen tellen
		    function(data, groepen, callback) {
		    	Vos.count({}).lean().exec(function(err, aantal) {
		    		if(err) {
		    			callback(true, err);
		    		} else {
		    			data.vossenTotaal = aantal;
		    			callback(null, data, groepen);
		    		}
		    	});
		    },
		    // Eindtijd opzoeken, resterende tijd berekenen
		    function(data, groepen, callback) {
		    	Instelling.find({instelling: 'eindtijd'}).lean().exec(function(err, instelling) {
					if(err) {
						callback(true, err);
					} else {
						var splitTijd = instelling[0].waarde.split(":");

						var eindTijd = new Date();
						eindTijd.setHours(splitTijd[0]);
						eindTijd.setMinutes(splitTijd[1]);

						var tijdResterend = Math.floor((eindTijd.getTime() - Date.now()) / 1000 / 60);
						if (tijdResterend < 0) {
							tijdResterend = 0;
						}

						data.tijdResterend = tijdResterend;
						callback(null, data);
					}
				});
		    }
		  ],
		  // Et voila!
		  function(err,data) {
		  		if (err) {
		  			console.log(err);
		  		}
		  		res.locals.data = data;
		  		res.render('frontend/index');
		});
	}
});

frontEnd.get('/ranglijst', function(req, res) {
	Groep.find({}, null, {sort: {vangsten: -1}}).lean().exec(function(err, groepen) {
		if(err) {
			res.json(err);
		} else {
			var rank = 1;
			groepen.forEach( function (groep) {
			    groep.rank = rank;
			    rank++;
			    if(groep.nummer === Number(req.session.groep)) {
			    	groep.actief = true;
			    }
			});
			res.locals.ranglijst = groepen;
			res.render('frontend/ranglijst');
		}
	});
});

frontEnd.get('/registreer/:groep', function(req, res) {
	var groep = req.params.groep;
	req.session.groep = groep;

	Groep.find({nummer: groep}).limit(1).exec(function(err, resultaat) {
		// Error?
		if(err) {
			res.end('Error!' + err);
		} else {
			// 1. Check of er resultaat is
			if (resultaat.length !== 0) {
				// 2. Ja, niks doen
			} else {
				// Nog niet in de database, invoegen
				var nieuweGroep = new Groep({
					nummer: groep,
					vangsten: 0
				});			
				nieuweGroep.save(function(err, resultaat) {
					if(err) {
							res.end(err);
					}
				});
			}
			req.session.bericht = {
				type: 'succes',
				titel: 'Gelukt!',
				inhoud: 'Jullie zijn aangemeld als groep ' + groep + '.'
			};
			verstuurBericht('Nieuwe groep geregistreerd: ' + groep, req);
			res.redirect('/vossenjacht');			
		}
	});
});
// TO DO: ook async maken
frontEnd.get('/vang/:vos', function(req, res) {
	var vos = req.params.vos;
	var groep = req.session.groep;
	
	// 1. Checken of groep aangemeld is
	if (Object.keys(groep).length !== 0) {	
	// 2. Checken of vos bestaat
		Vos.findById(vos, function(err, vosBestaat){
			if(err) {
				if (err.name === 'CastError') {
					req.session.bericht = {
						type: 'faal',
						titel: 'Mislukt!',
						inhoud: 'Dat is geen geldig nummer voor een vos.'
					};
					res.redirect('/vossenjacht');
				} else {
					req.session.bericht = {
						type: 'faal',
						titel: 'Mislukt!',
						inhoud: 'Er ging iets mis. Probeer het nog eens.'
					};
					res.redirect('/vossenjacht');
				}
			} else if(!err && vosBestaat) {		
				// 3. Checken of groep/vos uniek is
				Vangst.find({'vosId': vos, 'groepId': groep}).limit(1).exec(function(err, vangstBestaat){
					if(err) {
						req.session.bericht = {
							type: 'faal',
							titel: 'Mislukt!',
							inhoud: 'Er ging iets mis. Probeer het nog eens.'
						};
						res.redirect('/vossenjacht');
					} else if (vangstBestaat === undefined || vangstBestaat.length === 0) {
						// 4. Vangst invoegen
						var nieuweVangst = new Vangst({
							groepId: groep,
							vosId: vos
						}); 
						nieuweVangst.save(function(err) {
							if(err) {
								req.session.bericht = {
									type: 'faal',
									titel: 'Mislukt!',
									inhoud: 'Er ging iets mis. Probeer het nog eens.'
								};
								res.redirect('/vossenjacht');
							} else {
								// 5. Score +1
								Groep.find({nummer: groep}).limit(1).exec(function(err, groep) {
									if(err) {
										req.session.bericht = {
											type: 'faal',
											titel: 'Mislukt!',
											inhoud: 'Er ging iets mis. Probeer het nog eens.'
										};
										res.redirect('/vossenjacht');
									} else {
										groep[0].vangsten += 1;
										groep[0].save(function(err) {
											if(err) {
												req.session.bericht = {
													type: 'faal',
													titel: 'Mislukt!',
													inhoud: 'Er ging iets mis. Probeer het nog eens.'
												};
												res.redirect('/vossenjacht');
											}
											else {
												// En aantal vangsten van vos +1
												Vos.find({_id: vos}).limit(1).exec(function(err, vos) {
													vos[0].gevangen += 1;
													vos[0].save(function(err) {
														if(err) {
															req.session.bericht = {
																type: 'faal',
																titel: 'Mislukt!',
																inhoud: 'Er ging iets mis. Probeer het nog eens.'
															};
															res.redirect('/vossenjacht');
														} else {
															console.log(vos);
															verstuurBericht('Groep: ' + req.session.groep + ' heeft vos ' + vos[0].naam + ' gevangen!', req);
															var naam = vos[0].naam;
															req.session.bericht = {
																type: 'succes',
																titel: 'Gelukt!',
																inhoud: 'Jullie hebben vos ' + naam + ' gevangen!'
															};
															res.redirect('/vossenjacht');
														}
													});
												});
											}
										});
									}
								});
							}
						});
					} else {
						req.session.bericht = {
							type: 'faal',
							titel: 'Mislukt!',
							inhoud: 'Die vos hadden jullie al gevangen.'
						};
						res.redirect('/vossenjacht');	
					}
				});				
			} else {
				req.session.bericht = {
					type: 'faal',
					titel: 'Mislukt!',
					inhoud: 'Die vos bestaat niet.'
				};
				res.redirect('/vossenjacht');
			}
		});
	} else {
		res.end('niet ingelogd!');
	}
});

module.exports = frontEnd;