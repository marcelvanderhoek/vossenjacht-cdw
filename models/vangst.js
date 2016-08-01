var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VangstSchema = new Schema({
	groepId: Number,
	vosId: String,
	tijd: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vangst', VangstSchema);