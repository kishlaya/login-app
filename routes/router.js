var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
var User = require('../models/user');
var env_vars = require('../config/env_vars');

var myCaptcha = require('express-recaptcha');
var recaptcha = new myCaptcha(env_vars.SITE_KEY, env_vars.SITE_KEY);

var custom_msg = "";
router.get('/', recaptcha.middleware.render, function(req, res, next) {
	res.render('index', {captcha: res.recaptcha, message: custom_msg});
	custom_msg = "";
});

router.get('/profile', function(req ,res, next) {
	User.findById(req.session.userId)
		.exec(function(err, user) {
			if (err) {
				next(err);
			}
			else if (user == null) {
				console.log(req.session);
				custom_msg = "Please log in to continue!";
				res.redirect('/');
			}
			else {
				res.render('profile', {activated: user.activated, name: user.name});
			}
		});
});

router.post('/login', recaptcha.middleware.verify, function(req, res, next) {
	if (req.recaptcha.error) {
		return next(new Error('Captcha error'));
	}

	User.authenticate(req.body.email, req.body.password, function(err, user) {
		if (err || !user) {
			return next(err);
		}
		else {
			req.session.userId = user._id;
			res.redirect('/profile');
		}
	});
});

router.post('/register', recaptcha.middleware.verify, function(req, res, next) {
	if (req.recaptcha.error) {
		return next(new Error('Captcha error'));
	}
	
	var userData = {
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		activated: false
	}

	User.create(userData, function(err, user) {
		if (err) {
			var field = err.message.split('index: ')[1];
			field = field.split(' dup key')[0];
			field = field.substring(0, field.lastIndexOf('_'));

			if (field == 'email') {
				next(new Error('Someone else was here before you!'));
			}
			else {
				next(err);
			}
		}
		else {
			emailUser(user, function(err) {
				if (err) {
					next(err);
				}
				else {
					req.session.userId = user._id;
					res.redirect('/profile');
				}
			});
		}
	});
});

router.get('/activate', function(req ,res, next) {
	User.findByIdAndUpdate(req.query.uid, {activated: true}, function(err) {
		if (err) {
			next(err);
		}
		else {
			res.redirect('/profile');
		}
	});
});

router.get('/resend', function(req ,res, next) {
	if (!req.session) {
		next(new Error("Sorry, Do I know you?"));
	}
	else {
		User.findById(req.session.userId)
		.exec(function(err, user) {
			if (err) {
				next(err);
			}
			else if (user == null) {
				console.log(req.session);
				custom_msg = "Please log in to continue!";
				res.redirect('/');
			}
			else {
				emailUser(user, function(err) {
					if (err) {
						next(err);
					}
					else {
						custom_msg = "Activation Link has been resent!";
						res.redirect('/');
					}
				});
			}
		});
	}
});

router.get('/reset', recaptcha.middleware.render, function(req ,res, next) {
	res.render('reset', {captcha: res.recaptcha});
});

router.post('/reset', recaptcha.middleware.verify, function(req ,res, next) {
	if (req.recaptcha.error) {
		return next(new Error('Captcha error'));
	}

	User.findOne({email: req.body.email})
		.exec(function(err, user) {
			if (err) {
				next(err);
			}
			else if (req.body.oldpassword != user.password) {
				next(new Error('Incorrect old password'));
			}
			else {
				User.findOneAndUpdate({email: req.body.email}, {password: req.body.newpassword}, function(err) {
					if (err) {
						next(err);
					}
					else {
						if (req.session) {
							req.session.destroy(function(err) {
								if (err)
									return next(err);

								custom_msg = "Password has been reset. Login to continue!";
								res.redirect('/');
							});
						}
					}
				});
			}
		});
});

router.get('/logout', function(req ,res, next) {
	if (req.session) {
		req.session.destroy(function(err) {
			if (err)
				return next(err);

			custom_msg = "Logged out successfully!";
			res.redirect('/');
		});
	}
});

function emailUser(user, callback) {
	var transporter = nodemailer.createTransport({
		host: env_vars.EMAIL_HOST,
		port: env_vars.EMAIL_PORT,
		auth: {
			user: env_vars.LOGIN_ID,
			pass: env_vars.LOGIN_PASSWORD
		}
	});

	var link = env_vars.SERVER + '/activate?uid=' + user._id;

	var mailOptions = {
		from: env_vars.LOGIN_ID,
		to: user.email,
		subject: 'Account activation for Login App',
		text: link,
		html: "Hello, " + user.name + "<br><a href='" + link + "'>Link</a> to activate account"
	};

	transporter.sendMail(mailOptions, function(err, info) {
		if (err) {
			callback(err);
		}
		else {
			console.log("Email sent: " + info.response);
			callback();
		}
	});
}

module.exports = router;