var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LogboekSchema = new Schema({
	bericht: String,
	tijd: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Logboek', LogboekSchema);