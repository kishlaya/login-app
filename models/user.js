var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	activated: {
		type: Boolean,
		required: true
	}
});

UserSchema.statics.authenticate = function(email, password, callback) {
	User.findOne({ email: email })
		.exec(function(err, user) {
			if (err) {
				return callback(err);
			}
			else if (user == null) {
				return callback(new Error('Have you considered signing up?'));
			}
			bcrypt.compare(password, user.password, function(err, result) {
				if (result === true) {
					return callback(null, user);
				}
				else {
					return callback(new Error("Hello there, my password!"));
				}
			})
		});
};

UserSchema.pre('save', function(next) {
	var user = this;
	bcrypt.hash(user.password, 10, function(err, hash) {
		if (err) {
			return next(err);
		}
		else {
			user.password = hash;
			next();
		}
	});
});

var User = mongoose.model('User', UserSchema);

module.exports = User;