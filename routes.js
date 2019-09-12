//Authentication
const auth = require('./auth');
const bcrypt = require('bcrypt');
const validator = require('validator');

const mailer = require('./mailer');
const mapper = require('./mapper');

const catchError = (err) => {
	//TODO db log
	console.log(err);
};

const routes = {

	//Authentication

	public: {
		authenticate: (req, res, db) => {
			let userId = req.userId;
			let username = req.username;
	
			if(userId) {
				//Refresh the token after a successful authenticate
				auth.getJwtToken(userId, username, (token) => {
					res.json({
						username: username,
						userId: userId,
						token
					});
				})
			} else {
				res.json({});
			}
		},
	
		login: (req, res, db) => {
			let email = req.body.email.trim();
			let password = req.body.password;
	
			db.User.findOne({
				where: {
					Email: email
				}
			})
			.then(dbUser => {
				if(dbUser) {
					if(!!dbUser.VerificationToken) {
						//TODO, if a large period of time has passed, send the verification email again
						res.json({
							error: 'Please verify your email address.'
						});
					} else {
						bcrypt.compare(password, dbUser.Password).then(isMatch => {
							if(isMatch) {
								auth.getJwtToken(dbUser.UserId, dbUser.Username, token => {
									res.json({
										token
									});
								});
							} else {
								res.json({
									error: 'Invalid email or password.'
								});
							}
						});
					}
				} else {
					res.json({
						error: 'Invalid email or password.'
					});
				}
			})
		},
	
		register: (req, res, db) => {
			let email = req.body.email.trim();
			let username = req.body.username.trim();
			let password = req.body.password;
	
			let isValidEmail = validator.isEmail(email);
			let isValidUsername = validator.isLength(username, {min: 3, max: 20 });
			let isValidPassword = validator.isLength(password, {min:8, max: 127});
	
			//TODO validate password and email
			if(isValidEmail && isValidUsername && isValidPassword) {
				db.User.findOne({
					where: {
						[db.op.or]: [{
							Email: email
						}, {
							Username: username
						}]
					}
				})
				.then(dbExistingUser => {
					if(!dbExistingUser) {
						auth.hashPassword(password, (err, hashedPassword) => {
							let verificationToken = auth.getHexToken();
	
							db.User.create({
								Email: email,
								Username: username,
								Password: hashedPassword,
								VerificationToken: verificationToken
							})
							.then(dbCreatedUser => {
								mailer.sendVerificationEmail(email, username, verificationToken);
								res.json({ success: true });
							})
							.catch(catchError);
						});
					} else {
						res.json({
							error: dbExistingUser.Email === email
								? 'Email is already in use. Please log in with your existing account or reset your password.'
								: 'Username is already in use. Please choose another username.'
						});
					}
				})
				.catch(catchError)
			} else {
				res.json({
					error: 'Something went wrong. Please refresh and try again.'
				});
			}
		}, 
	
		getTemplate: (req, res, db) => {
			let templateId = req.body.templateId;

			db.Template.findOne({
				where: templateId
					? {
						TemplateId: templateId
					}
					: {
						//TODO no id? get latest
					},
				include: [{
					model: db.TemplateDialogue,
					as: 'TemplateDialogues'
				}]
			})
			.then(dbTemplate => {
				if(dbTemplate) {
					res.json(mapper.fromDbTemplate(dbTemplate))
				} else {
					res.json({
						error: 'Template not found'
					});
				}
			})
			.catch(catchError);
		},
	},

	private: {
		changeUsername: (req, res, db) => {
			let userId = req.userId;
	
			let username = req.body.username.trim();
			let isValidUsername = validator.isLength(username, {min: 3, max: 20 });
	
			if(isValidUsername) {
				db.User.findOne({
					where: {
						Username: username
					}
				})
				.then(dbExistingUser => {
					if(!dbExistingUser) {
						db.User.update({
							Username: username
						}, {
							where: {
								UserId: userId
							}
						})
					} else {
		
					}
				});
			} else {
				res.json({
					error: 'Something went wrong. Please refresh and try again.'
				});
			}
		},
	
		forgotPassword: (req, res, db) => {
			let email = req.body.email.trim();

			db.User.findOne({
				where: {
					Email: email,
					VerificationToken: null
				}
			})
			.then(dbUser => {
				if(dbUser) {
					let passwordResetToken = auth.getHexToken();
					dbUser.PasswordResetToken = passwordResetToken;
					dbUser.PasswordResetAt = new Date();

					mailer.sendForgotPasswordEmail(email, passwordResetToken);
				} else {
					mailer.sendForgotPasswordNoAccountEmail(email);
				}

				//Always say the same thing, even if it didn't work
				res.json({ success: true });
			})
			.catch(catchError);
		},

		changePassword: (req, res, db) => {
	
		},

		//Comics
		voteComic: (req, res, db) => {
			let comicId = req.body.comicId;
		},
	
		//Miscellaneous
		customers: (req, res, db) => {
			db.User.findAll()
				.then(dbUsers => {
					res.json(dbUsers.map(dbUser => mapper.fromDbUser(dbUser)));
				})
				.catch(catchError);
		}
	}
};

module.exports = routes;