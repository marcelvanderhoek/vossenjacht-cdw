var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GroepSchema = new Schema({
	nummer: { type: Number, unique: true },
	vangsten: Number  
});

module.exports = mongoose.model('Groep', GroepSchema);