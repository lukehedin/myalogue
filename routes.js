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

//The object sent to a successfully authenticated user
const getAuthResult = (userId, username, callback) => {
	auth.getJwtToken(userId, username, (token) => {
		callback({
			username: username,
			userId: userId,
			token
		});
	})
};

const routes = {

	//Authentication

	public: {
		authenticate: (req, res, db) => {
			let userId = req.userId;
			let username = req.username;
	
			if(userId) {
				//Refresh the token after a successful authenticate
				getAuthResult(userId, username, authResult => {
					res.json(authResult);
				});
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
								getAuthResult(dbUser.UserId, dbUser.Username, authResult => {
									res.json(authResult);
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

		verifyAccount: (req, res, db) => {
			let token = req.body.token;

			db.User.findOne({
				where: {
					VerificationToken: token
				}
			})
			.then((dbUser) => {
				if(dbUser) {
					dbUser.VerificationToken = null;
					dbUser.save();

					getAuthResult(dbUser.UserId, dbUser.Username, authResult => {
						res.json(authResult);
					});
				} else {
					res.json({
						error: 'Account verification failed.'
					});
				}
			});
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

		getComics: (req, res, db) => {
			let userId = req.userId; //Might be null
			let templateId = req.body.templateId;

			let comicInclude = [{
				model: db.ComicDialogue,
				as: 'ComicDialogues'
			}];

			if(userId) {
				comicInclude.push({
					model: db.ComicVote,
					as: 'ComicVotes',
					required: false,
					where: {
						UserId: userId
					}
				});
			}

			db.Comic.findAll({
				where: {
					TemplateId: templateId
				},
				include: comicInclude
			})
			.then(dbComics => {
				res.json(dbComics.map(dbComic => {
					let comic = mapper.fromDbComic(dbComic);
					if(dbComic.ComicVotes && dbComic.ComicVotes.length === 1) {
						comic.voteValue = dbComic.ComicVotes[0].Value;
					}
					return comic;
				}));
			})
			.catch(catchError);
		},

		submitComic: (req, res, db) => {
			let comic = req.body.comic;

			db.Comic.create({
				TemplateId: comic.templateId,
				ComicDialogues: comic.comicDialogues.map(cd => {
					return {
						TemplateDialogueId: cd.templateDialogueId,
						Value: cd.value
					};
				})
			}, {
				include: [{
					model: db.ComicDialogue,
					as: 'ComicDialogues'
				}]
			})
			.then(dbCreatedComic => {
				console.log(dbCreatedComic);

				res.json({
					success: true,
					comic: mapper.fromDbComic(dbCreatedComic)
				})
			})
			.catch(catchError);
		}
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
			let userId = req.userId;
			let comicId = req.body.comicId;
			let value = req.body.value;

			if(value > 1 || value < -1) {
				res.json({
					success: false,
					error: 'Invalid vote value supplied'
				})
			} else {
				db.ComicVote.findOne({
					where: {
						UserId: userId,
						ComicId: comicId
					}
				})
				.then(dbComicVote => {
					if(dbComicVote) {
						dbComicVote.Value = value;
						dbComicVote.save();
					} else {
						db.ComicVote.create({
							UserId: userId,
							ComicId: comicId,
							Value: value
						});
					}

					res.json({
						success: true
					});
				})
				.catch(catchError)
			}
		},
	
		commentComic: (req, res, db) => {
			let userId = req.userId;
			let comicId = req.body.comicId;
			let value = req.body.value;

			db.ComicComment.create({
				UserId: userId,
				ComicId: comicId,
				Value: value
			});

			res.json({
				success: true
			});
		},

		deleteComment: (req, res, db) => {
			let userId = req.userId;
			let comicCommentId = req.body.comicCommentId;

			db.ComicComment.destroy({
				where: {
					UserId: userId, //This ensures only the creator can delete
					ComicCommentId: comicCommentId
				}
			});

			res.json({
				success: true
			});
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