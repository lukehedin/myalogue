//Authentication
const auth = require('./auth');
const bcrypt = require('bcrypt');
const validator = require('validator');

const mailer = require('./mailer');
const mapper = require('./mapper');

const catchError = (res, error) => {
	//TODO db log
	console.log(error);
	res.json({ error: error });
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
						catchError(res, 'Please verify your email address.');
						//TODO, if a large period of time has passed, send the verification email again
					} else {
						bcrypt.compare(password, dbUser.Password).then(isMatch => {
							if(isMatch) {
								getAuthResult(dbUser.UserId, dbUser.Username, authResult => {
									res.json(authResult);
								});
							} else {
								//Invalid password
								catchError(res, 'Invalid email or password.');
							}
						});
					}
				} else {
					//Invalid email
					catchError(res, 'Invalid email or password.');
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
							.catch(error => catchError(res, error));
						});
					} else {
						catchError(res, dbExistingUser.Email === email
							? 'Email is already in use. Please log in with your existing account or reset your password.'
							: 'Username is already in use. Please choose another username.');
					}
				})
				.catch(error => catchError(res, error));
			} else {
				catchError(res, 'Something went wrong. Please refresh and try again.');
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
					catchError(res, 'Account verification failed.');
				}
			});
		},
	
		getTemplate: (req, res, db) => {
			let ordinal = req.body.ordinal;

			db.Template.findAll({
				where: ordinal
					? {
						Ordinal: ordinal
					}
					: {
						//TODO no id? get latest
					},
				include: [{
					model: db.TemplateDialogue,
					as: 'TemplateDialogues'
				}],
				limit: 1,
				order: [[ 'Ordinal', 'DESC' ]]
			})
			.then(dbTemplates => {
				if(dbTemplates && dbTemplates[0]) {
					res.json(mapper.fromDbTemplate(dbTemplates[0]))
				} else {
					catchError(res, 'Template not found.');
				}
			})
			.catch(error => catchError(res, error));
		},

		getComics: (req, res, db) => {
			let userId = req.userId; //Might be null
			let templateId = req.body.templateId;

			let idNotIn = req.body.idNotIn || [];
			let includeAnonymous = req.body.includeAnonymous;
			let createdAtBefore = req.body.createdAtBefore || new Date();
			let sortBy = req.body.sortBy || 1;
			let offset = req.body.offset || 0;
			let limit = req.body.limit || 5;

			let comicOrder = [];

			switch(sortBy) {
				case 3: //random
					comicOrder.push(db.fn('RANDOM'));
					break;
				case 2: //newest
					//Thenby will do this for us
					break;
				default: //top rated (1)
					comicOrder.push([ 'Rating', 'DESC' ]);
					break;
			};
			comicOrder.push([ 'CreatedAt', 'DESC' ]);//Thenby

			let comicInclude = [{
				model: db.ComicDialogue,
				as: 'ComicDialogues'
			}, {
				model: db.User,
				as: 'User'
			}];

			if(userId) {
				//Include the user's current vote on the comic
				comicInclude.push({
					model: db.ComicVote,
					as: 'ComicVotes',
					required: false,
					where: {
						UserId: userId
					}
				});
			}

			let comicWhere = {
				TemplateId: templateId,
				CreatedAt: {
					[db.op.lte]: createdAtBefore
				},
				ComicId: {
					[db.op.notIn]: idNotIn
				}
			};

			if(!includeAnonymous) {
				comicWhere.UserId = {
					[db.op.ne]: null
				};
			}

			db.Comic.findAll({
				where: comicWhere,
				order: comicOrder,
				offset: offset,
				limit: limit,
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
			.catch(error => catchError(res, error));
		},

		submitComic: (req, res, db) => {
			let userId = req.userId; // May be null
			let comic = req.body.comic;

			let invalidDialogue = !!comic.comicDialogues.find(cd => !cd.value || cd.value.length > 255);
			if(!invalidDialogue) {
				db.Comic.create({
					TemplateId: comic.templateId,
					UserId: userId,
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
					res.json({
						comic: mapper.fromDbComic(dbCreatedComic)
					})
				})
				.catch(error => catchError(res, error));
			} else {
				catchError(res, 'Invalid comic data supplied.');
			}
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
				catchError(res, 'Something went wrong. Please refresh and try again.');
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
			.catch(error => catchError(res, error));
		},

		changePassword: (req, res, db) => {
	
		},

		//Comics
		voteComic: (req, res, db) => {
			let userId = req.userId;
			let comicId = req.body.comicId;
			let value = req.body.value;

			//Value can only be 1, 0, -1
			if(value > 1 || value < -1) {
				catchError(res, 'Invalid vote value supplied.');
			} else {
				db.Comic.findOne({
					where: {
						ComicId: comicId
					},
					include: [{
						//Include the user's current vote on the comic
						model: db.ComicVote,
						as: 'ComicVotes',
						required: false,
						where: {
							UserId: userId
						}
					}]
				})
				.then(dbComic => {
					if(dbComic) {
						let comicRatingAdjustment = 0;

						let existingDbComicVote = dbComic.ComicVotes && dbComic.ComicVotes[0]
							? dbComic.ComicVotes[0]
							: null;

						if(existingDbComicVote) {
							//No need to do anything if the value is the same for some reason
							if(existingDbComicVote.Value !== value) {
								//Incoming value subtract the existing value (maths!)
								comicRatingAdjustment = value - existingDbComicVote.Value;

								db.ComicVote.update({
									Value: value
								}, {
									where: {
										ComicVoteId: existingDbComicVote.ComicVoteId
									}
								});
							}
						} else {
							comicRatingAdjustment = value;
		
							db.ComicVote.create({
								UserId: userId,
								ComicId: comicId,
								Value: value
							});
						}
		
						if(comicRatingAdjustment !== 0) {
							dbComic.Rating = (dbComic.Rating || 0) + comicRatingAdjustment;
							dbComic.save();
						}
		
						res.json({ success: true });

					} else {
						catchError(res, 'Invalid comic ID.');
					}
				})
				.catch(error => catchError(res, error));
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

			res.json({ success: true });

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

			res.json({ success: true });

		},

		//Miscellaneous
		customers: (req, res, db) => {
			db.User.findAll()
				.then(dbUsers => {
					res.json(dbUsers.map(dbUser => mapper.fromDbUser(dbUser)));
				})
				.catch(error => catchError(res, error));
		}
	}
};

module.exports = routes;