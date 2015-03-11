var mongoose = require('mongoose');

var schema = new mongoose.Schema({
	//username, email, password, etc.
	username: {type: String},
	notifications: [{
		body: {type: String},
		createAt: {type: Date, default: Date.now},
		read: {type: Boolean, default: false}
	}]
});

module.exports = mongoose.model('User', schema);