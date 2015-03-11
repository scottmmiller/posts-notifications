var mongoose = require('mongoose');

var schema = new mongoose.Schema({
	user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	title: {type: String},
	body: {type: String},
	createdAt: {type: Date, default: Date.now},
	updatedAt: {type: Date, default: Date.now},
	//history: [{title: {type: String}, body: {type: String}}]
});

module.exports = mongoose.model('Post', schema);