var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VosSchema = new Schema({
	naam: String,
	nummer: Number,
	beschrijving: String,
	locatieLong: Number,
	locatieLat: Number,
	gevangen: {type: Number, default: 0}
});

module.exports = mongoose.model('Vos', VosSchema);