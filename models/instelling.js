var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var InstellingSchema = new Schema({
	instelling: String,
	waarde: String
});

module.exports = mongoose.model('Instelling', InstellingSchema);