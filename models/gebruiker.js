var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GebruikerSchema = new Schema({
	gebruikersnaam: String,
	wachtwoord: String,
	email: String
});

module.exports = mongoose.model('Gebruiker', GebruikerSchema);