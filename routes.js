const validator = require('validator');
const https = require('https');
const moment = require('moment');

const mailer = require('./mailer');
const mapper = require('./mapper');

//Authentication
const auth = require('./auth');
const bcrypt = require('bcrypt');

const TOKEN_RESET_HOURS = 3;

const COMIC_PANEL_LENGTH = 8;

const catchError = (res, error, db = null) => {
	// If db param specified, the error is treated as a serious error
	// It will be logged, and the error to the client will be generic

	console.log(error);

	if(db) {
		db.Log.create({
			Type: '500 ERROR',
			Message: error.toString()
		});
	}

	res.json({ 
		error: db 
			? 'Sorry, something went wrong. Please try again later.' 
			: error
	});
};

const isEmailAcceptable = (email, callback) => {
	https.get(`https://open.kickbox.com/v1/disposable/${email}`, (response) => {
		let responseBody  = '';
		response.on('data', (chunk) => { responseBody += chunk; });
		response.on('end', () => {
			let responseJson = JSON.parse(responseBody);
			callback(responseJson && responseJson.hasOwnProperty('disposable') && !responseJson.disposable)
		});
	});
};

//The object sent to a successfully authenticated user
const getAuthResult = (dbUser, callback) => {
	auth.getJwtToken(dbUser.UserId, (token) => {
		let result = {
			username: dbUser.Username,
			userId: dbUser.UserId,
			token
		};

		callback(result);
	})
};

//Common db functions
const getDbComicInclude = (db, userId, excludePanelUsers = false) => {
	let include = [{
		model: db.ComicPanel,
		as: 'ComicPanels'
	}];

	if(!excludePanelUsers) {
		include.include = [{
			model: db.User,
			as: 'User'
		}];
	}
	
	if(userId) {
		//Include the user's current vote on the comic
		include.push({
			model: db.ComicVote,
			as: 'ComicVotes',
			required: false,
			where: {
				UserId: userId
			}
		});
	}

	return include;
};
const getDbTemplateWhereUnlocked = (db) => {
	return {
		UnlockedAt: {
			[db.op.ne]: null,
			[db.op.lte]: new Date()
		}
	};
}

const routes = {

	//Authentication

	public: {
		authenticate: (req, res, db) => {
			let userId = req.userId;
			
			if(process.env.IS_UNDER_MAINTENANCE === 'true') {
				res.json({
					isUnderMaintenance: true
				});
			} else {
				let referenceDataPromises = [
					db.Template.findAll({
						where: getDbTemplateWhereUnlocked(db),
						include: [{
							model: db.TemplatePanel,
							as: 'TemplatePanels'
						}],
						order: [[ 'TemplateId', 'DESC' ]]
					}),
					new Promise((resolve, reject) => {
						db.Comic.findAll({
							where: {
								CompletedAt: {
									[db.op.ne]: null
								}
							},
							// a newer comic tie will beat an older comic (it got more ratings in shorter time)
							order: [[ 'CreatedAt', 'DESC' ]]
						})
						.then(dbComics => {
							//Find the top comics
							let topComics = {};
							dbComics.forEach(dbComic => {
								let currentTop = topComics[dbComic.TemplateId];
								if(!currentTop || (currentTop && currentTop.Rating <= dbComic.Rating)) {
									topComics[dbComic.TemplateId] = dbComic;
								}
							});
							let topComicIds = Object.keys(topComics).map(key => topComics[key].ComicId);

							//Get these ones WITH includes
							db.Comic.findAll({
								where: {
									ComicId: {
										[db.op.in]: topComicIds
									}
								},
								include: getDbComicInclude(db, userId),
							})
							.then(dbComicsWithInclude => resolve(dbComicsWithInclude))
							.catch(error => reject(error));
						})
						.catch(error => catchError(res, error, db));
					})
				];
	
				Promise.all(referenceDataPromises)
					.then(([dbTemplates, dbTopComics]) => {
						let result = {
							referenceData: {
								topComics: dbTopComics
									.sort((c1, c2) => c1.TemplateId - c2.TemplateId)
									.map(mapper.fromDbComic),
								templates: dbTemplates
									.sort((t1, t2) => t1.TemplateId - t2.TemplateId)
									.map(mapper.fromDbTemplate)
							}
						}

						if(process.env.NODE_ENV === 'development') result.isDev = true;
	
						if(userId) {
							db.User.findOne({
								where: {
									UserId: userId
								}
							})
							.then(dbUser => {
								if(dbUser) {
									//Record the lastloginat - no need to await
									dbUser.LastLoginAt = new Date();
									dbUser.save();

									//Refresh the token after a successful authenticate
									getAuthResult(dbUser, authResult => {
										res.json({
											...result,
											...authResult
										});
									});
								} else {
									catchError(res, 'Invalid userId in token', db);
								}
							});
						} else {
							res.json({
								...result
							});
						}
					})
					.catch(error => catchError(res, error, db));
			}
		},
	
		login: (req, res, db) => {
			let emailUsername = req.body.emailUsername.trim();
			let password = req.body.password;
	
			//Username can't have @ or . in it, while email MUST.
			//Thus, there can be no crossover.
			db.User.findOne({
				where: {
					[db.op.or]: [{
						Email: emailUsername
					}, {
						Username: emailUsername
					}]
				}
			})
			.then(dbUser => {
				if(dbUser) {
					if(!!dbUser.VerificationToken) {
						let now = new Date();

						if(dbUser.VerificationTokenSetAt < moment(now).subtract(TOKEN_RESET_HOURS, 'hours').toDate()) {
							let newVerificationToken = auth.getHexToken();
							dbUser.VerificationToken = newVerificationToken;
							dbUser.VerificationTokenSetAt = now;
							dbUser.save();

							mailer.sendVerificationEmail(dbUser.Email, dbUser.Username, newVerificationToken);
							catchError(res, 'Please verify your email address. A new verification email has been sent.');
						} else {
							catchError(res, 'Please verify your email address.');
						}
					} else {
						bcrypt.compare(password, dbUser.Password).then(isMatch => {
							if(isMatch) {
								getAuthResult(dbUser, authResult => {
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
			let isValidUsername = validator.isLength(username, {min: 3, max: 20 }) && validator.isAlphanumeric(username);
	
			// Basic validation
			if(isValidEmail && isValidUsername) {
				//Check for existing username or email match
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
						//Check for disposable email
						isEmailAcceptable(email, (isAcceptable) => {
							if(isAcceptable) {
								//Checks if password valid too
								auth.hashPassword(password, (error, hashedPassword) => {
									if(!error && hashedPassword) {
										let verificationToken = auth.getHexToken();
				
										db.User.create({
											Email: email,
											Username: username,
											Password: hashedPassword,
											VerificationToken: verificationToken,
											VerificationTokenSetAt: new Date()
										})
										.then(() => {
											mailer.sendVerificationEmail(email, username, verificationToken);
											res.json({ success: true });
										})
										.catch(error => catchError(res, error, db));
									} else {
										//don't give password error details
										catchError(res, 'Invalid password supplied.', db);
									}
								});
							} else {
								catchError(res, 'Disposable emails are not allowed. Please enter another email address.');
							}
						});
					} else {
						catchError(res, dbExistingUser.Email === email
							? 'Email is already in use. Please log in with your existing account or reset your password.'
							: 'Username is already in use. Please choose another username.');
					}
				})
				.catch(error => catchError(res, error, db));
			} else {
				catchError(res, 'Invalid email or username supplied.', db);
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

					getAuthResult(dbUser, authResult => {
						res.json(authResult);
					});
				} else {
					catchError(res, 'Account verification failed.');
				}
			});
		},
	
		forgotPassword: (req, res, db) => {
			let email = req.body.email.trim();
			
			let now = new Date();

			db.User.findOne({
				where: {
					Email: email,
					VerificationToken: {
						[db.op.eq]: null
					},
					[db.op.or]: [{
						PasswordResetAt: {
							//Don't let someone request a password if a request is already in progress
							[db.op.lte]: moment(now).subtract(TOKEN_RESET_HOURS, 'hours').toDate()
						}
					}, {
						PasswordResetAt: {
							[db.op.eq]: null
						}
					}]
				}
			})
			.then(dbUser => {
				if(dbUser) {
					let passwordResetToken = auth.getHexToken();
					dbUser.PasswordResetToken = passwordResetToken;
					dbUser.PasswordResetAt = now;
					dbUser.save();

					mailer.sendForgotPasswordEmail(email, dbUser.Username, passwordResetToken);
				} else {
					// mailer.sendForgotPasswordNoAccountEmail(email);
				}
			})
			.catch(error => catchError(res, error, db));

			//Always say the same thing, even if it didn't work
			res.json({ success: true });
		},

		setPassword: (req, res, db) => {
			let token = req.body.token;
			let password = req.body.password;

			let now = new Date();

			if(token) {
				db.User.findOne({
					where:{
						PasswordResetAt: {
							[db.op.lte]: moment(now).add(TOKEN_RESET_HOURS, 'hours').toDate()
						},
						PasswordResetToken: token
					}
				})
				.then(dbUser => {
					if(dbUser) {
						auth.hashPassword(password, (error, hashedPassword) => {
							if(!error && hashedPassword) {

								dbUser.Password = hashedPassword;
								dbUser.PasswordResetAt = null;
								dbUser.PasswordResetToken = null;
								dbUser.save()
									.then(() => {
										//Wait for this save in case it fails
										getAuthResult(dbUser, authResult => {
											res.json(authResult);
										});
									})
									.catch(error => catchError(res, error, db));
							} else {
								 //don't give password error details
								catchError(res, 'Invalid password supplied.', db);
							}
						});
					} else {
						catchError(res, 'This password reset request is invalid or has expired.');
					}
				})
				.catch(error => catchError(res, error, db));
			} else {
				catchError(res, 'This password reset request is invalid or has expired.');
			}
		},

		getComic: (req, res, db) => {
			let userId = req.userId; //Might be null
			let comicId = req.body.comicId;

			db.Comic.findOne({
				where: {
					CompletedAt: {
						[db.op.ne]: null
					},
					ComicId: comicId
				},
				include: getDbComicInclude(db, userId)
			})
			.then(dbComic => {
				if(dbComic) {
					res.json(mapper.fromDbComic(dbComic));
				} else {
					catchError(res, 'Comic not found.', db);
				}
			})
			.catch(error => catchError(res, error, db));
		},
		
		getComics: (req, res, db) => {
			let userId = req.userId; //Might be null

			let templateId = req.body.templateId;

			let idNotIn = req.body.idNotIn || [];
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

			let comicWhere = {
				CompletedAt: {
					[db.op.ne]: null
				},
				CreatedAt: {
					[db.op.lte]: createdAtBefore
				},
				ComicId: {
					[db.op.notIn]: idNotIn
				}
			};

			if(templateId) {
				comicWhere.TemplateId = templateId;
			}
			db.Comic.findAll({
				where: comicWhere,
				order: comicOrder,
				offset: offset,
				limit: limit,
				include: getDbComicInclude(db, userId)
			})
			.then(dbComics => res.json(dbComics.map(dbComic => mapper.fromDbComic(dbComic))))
			.catch(error => catchError(res, error, db));
		},

		getUser: (req, res, db) => {
			let requestedUserId = req.body.requestedUserId; //do not confuse

			db.User.findOne({
				where: {
					UserId: requestedUserId,
					VerificationToken: {
						[db.op.eq]: null  //unverified users cant be viewed
					}
				}
			})
			.then(dbUser => {
				dbUser
					? res.json(mapper.fromDbUser(dbUser))
					: catchError(res, 'User not found.')
			})
			.catch(error => catchError(res, error, db));
		}
	},

	private: {
		changeUsername: (req, res, db) => {
			let userId = req.userId;
	
			let username = req.body.username.trim();
			let isValidUsername = validator.isLength(username, { min: 3, max: 20 });
	
			if(isValidUsername) {
				db.User.findOne({
					where: {
						Username: username
					}
				})
				.then(dbExistingUser => {
					if(!dbExistingUser) {
						db.User.update({
							Username: username,
							VerificationToken: {
								[db.op.eq]: null
							}
						}, {
							where: {
								UserId: userId
							}
						})
					} else {
		
					}
				});
			} else {
				catchError(res, 'Invalid username supplied.', db);
			}
		},

		setPassword: (req, res, db) => {
			//Must be logged in
			let userId = req.userId;

		},

		//Gets a comic in progress or starts new
		play: (req, res, db) => {
			let templateId = req.body.templateId;

			let now = new Date();

			let comicWhere = {
				CompletedAt: {
					[db.op.eq]: null
				},
				[db.op.or]: [{
					LockedAt: {
						[db.op.eq]: null
					}
				}, {
					LockedAt: {
						[db.op.gte]: moment(now).add(1, 'minute').toDate()
					}
				}]
			};

			if(templateId) comicWhere.TemplateId = template;

			//Get random incomplete comic
			db.Comic.findAll({
				limit: 1,
				where: comicWhere,
				include: getDbComicInclude(db, null, true),
				order: [db.fn('RANDOM')]
			})
			.then(dbComics => {
				let dbComic = dbComics[0];

				if(dbComic) {
					let currentPanel = dbComic.ComicPanels[dbComic.ComicPanels.length - 1];
					let isLastPanel = dbComic.ComicPanels.length === (COMIC_PANEL_LENGTH  - 1);

					dbComic.LockedAt = now;
					dbComic.save()
						.then(() => res.json({
							comicId: dbComic.ComicId,
							templateId: dbComic.TemplateId,
							currentPanel: mapper.fromDbComicPanel(currentPanel),
							isLastPanel: isLastPanel
						}))
						.catch(error => catchError(res, error, db));

				} else {
					//Client will create new comic
					res.json({ isNew: true });
				}
			})
			.catch(error => catchError(res, error, db));
		},

		submitComicPanel: (req, res, db) => {
			let userId = req.userId; // May be null
			let comic = req.body.comic;
			let dialogue = req.body.dialogue;

			let isValidTitle = validator.isLength(comic.title, { max: 0 })
				|| (validator.isLength(comic.title, { max: 30 }) && validator.isAlphanumeric(validator.blacklist(comic.title, ' ')));
			let isValidDialogue = validator.isLength(dialogue, { min: 1, max: 255 });
			

			///TODO
			if(isValidTitle && isValidDialogue) {
				db.Comic.create({
					TemplateId: comic.templateId,
					UserId: userId,
					Title: comic.title,
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
					res.json(mapper.fromDbComic(dbCreatedComic))
				})
				.catch(error => catchError(res, error, db));
			} else {
				catchError(res, 'Invalid comic data supplied.', db);
			}
		},

		//Comics
		voteComic: (req, res, db) => {
			let userId = req.userId;
			let comicId = req.body.comicId;
			let value = req.body.value;

			//Value can only be 1, 0, -1
			if(value > 1 || value < -1) {
				catchError(res, 'Invalid vote value supplied.', db);
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
						catchError(res, 'Invalid comic ID supplied.', db);
					}
				})
				.catch(error => catchError(res, error, db));
			}
		},
	
		// commentComic: (req, res, db) => {
		// 	let userId = req.userId;
		// 	let comicId = req.body.comicId;
		// 	let value = req.body.value;

		// 	db.ComicComment.create({
		// 		UserId: userId,
		// 		ComicId: comicId,
		// 		Value: value
		// 	});

		// 	res.json({ success: true });

		// },

		// deleteComment: (req, res, db) => {
		// 	let userId = req.userId;
		// 	let comicCommentId = req.body.comicCommentId;

		// 	db.ComicComment.destroy({
		// 		where: {
		// 			UserId: userId, //This ensures only the creator can delete
		// 			ComicCommentId: comicCommentId
		// 		}
		// 	});

		// 	res.json({ success: true });

		// }
	}
};

module.exports = routes;