const validator = require('validator');
const https = require('https');
const moment = require('moment');

const mailer = require('./mailer');
const mapper = require('./mapper');

//Authentication
const auth = require('./auth');
const bcrypt = require('bcrypt');

const ACCOUNT_VERIFICATION_TOKEN_RESET_HOURS = process.env.ACCOUNT_VERIFICATION_TOKEN_RESET_HOURS || 3;
const COMIC_LOCK_WINDOW_MINS = process.env.COMIC_LOCK_WINDOW_MINS || 3;
const COMIC_PANEL_SKIP_LIMIT = process.env.COMIC_PANEL_SKIP_LIMIT || 8;

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

	if(!res.headersSent) {
		res.json({ 
			error: db 
				? 'Sorry, something went wrong. Please try again later.' 
				: error
		});
	}
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

//Common functions
const createNotifications = (db, userIds, title, message, comicId) => {
	//Unique userids
	userIds = [...new Set(userIds)].filter(userId => !!userId && !isNaN(userId)); //Unique-ify and filter any null, undefined, 0 etc

	if(userIds && userIds.length > 0) {
		db.Notification.create({
			Title: title,
			Message: message,
			ComicId: comicId
		})
		.then(dbNotification => {
			db.UserNotification.bulkCreate(userIds.map(userId => {
				return {
					NotificationId: dbNotification.NotificationId,
					UserId: userId
				};
			}));
		});
	}
}
const getComicLockWindow = () => {
	//2min lock in case of slow data fetching and submitting
	return moment(new Date()).subtract(COMIC_LOCK_WINDOW_MINS, 'minutes').toDate();
};
const getRandomInt = (min, max) => {
	max = max + 1; //The max below is EXclusive, so we add one to it here to make it inclusive
	return Math.floor(Math.random() * (max - min)) + min;
};
const getRandomPanelCount = (maxPanelCount = 8) => {
	if(maxPanelCount % 2 === 1) maxPanelCount = maxPanelCount + 1; //No odd numbers allowed.
	let panelCount = 4;

	//Adds additional panel pairs
	if(maxPanelCount > panelCount) {
		let maxAdditionalPanelPairs = ((maxPanelCount - panelCount) / 2);
		let additionalPanels = (getRandomInt(0, maxAdditionalPanelPairs) * 2);
		panelCount = panelCount + additionalPanels;
	}

	return panelCount;
};

//Common INCLUDES
const getIncludeForComic = (db, userId) => {
	let include = [{
		model: db.ComicPanel,
		as: 'ComicPanels',
		include: [{
			model: db.User,
			as: 'User'
		}]
	}, {
		model: db.ComicComment,
		as: 'ComicComments',
		include: [{
			model: db.User,
			as: 'User'
		}]
	}];
	
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

//Common WHERES
const getWhereForUnlockedTemplates = (db, templateId = null) => {
	let unlockedTemplateWhere = {
		UnlockedAt: {
			[db.op.ne]: null,
			[db.op.lte]: new Date()
		}
	};

	if(templateId) unlockedTemplateWhere.TemplateId = templateId;
	return unlockedTemplateWhere;
};
const getWhereForEmailUsernameMatch = (db, email, username) => {
	//This should already be done, but just to be sure
	let cleanEmail = email.trim().toLowerCase();
	let cleanUsername = username.trim().toLowerCase();

	return {
		[db.op.or]: [
			db.where(db.fn('lower', db.col('Email')), cleanEmail),
			db.where(db.fn('lower', db.col('Username')), cleanUsername)
		]
	}
};

const routes = {

	public: {
		authenticate: (req, res, db) => {
			let userId = req.userId;
			let anonId = req.anonId;
			
			if(process.env.IS_UNDER_MAINTENANCE === 'true') {
				res.json({ isUnderMaintenance: true });
				return;
			}
			
			let referenceDataPromises = [
				db.Template.findAll({
					where: getWhereForUnlockedTemplates(db),
					paranoid: false, //Include archived templates
					include: [{
						model: db.TemplatePanel,
						as: 'TemplatePanels',
						paranoid: false //Include archived panels
					}],
					order: [[ 'TemplateId', 'DESC' ]]
				}),
				db.Comic.findAll({
					where: {
						CompletedAt: {
							[db.op.ne]: null
						}
					},
					include: getIncludeForComic(db, userId),
					order: [[ 'Rating', 'DESC' ]],
					limit: 1
				})
			];

			Promise.all(referenceDataPromises)
				.then(([dbTemplates, dbTopComics]) => {
					let result = {
						referenceData: {
							templates: dbTemplates
								.sort((t1, t2) => t1.TemplateId - t2.TemplateId)
								.map(mapper.fromDbTemplate),
							topComic: dbTopComics && dbTopComics.length === 1 
								? mapper.fromDbComic(dbTopComics[0]) 
								: null
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
							if(!dbUser) {
								catchError(res, 'Invalid userId in token', db);
								return;
							}
							
							//Record the lastloginat - no need to await
							dbUser.LastLoginAt = new Date();
							dbUser.save();

							//Refresh the token after a successful authenticate
							auth.getUserJwtResult(dbUser, userResult => {
								res.json({
									...result,
									...userResult
								});
							});
						});
					} else {
						//Refresh existing anonId if one supplied, otherwise generate new
						if(!anonId) anonId = auth.getHexToken();
						auth.getAnonJwtResult(anonId, anonResult => {
							res.json({
								...result,
								...anonResult
							});
						});
					}
				})
				.catch(error => catchError(res, error, db));
		},
	
		login: (req, res, db) => {
			let emailUsername = req.body.emailUsername.trim().toLowerCase();
			let password = req.body.password;
	
			//Username can't have @ or . in it, while email MUST.
			//Thus, there can be no crossover.
			db.User.findOne({
				where: getWhereForEmailUsernameMatch(db, emailUsername, emailUsername)
			})
			.then(dbUser => {
				if(dbUser) {
					if(!!dbUser.VerificationToken) {
						let now = new Date();

						if(dbUser.VerificationTokenSetAt < moment(now).subtract(ACCOUNT_VERIFICATION_TOKEN_RESET_HOURS, 'hours').toDate()) {
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
								auth.getUserJwtResult(dbUser, userResult => res.json(userResult));
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
			const forbiddenUsernames = ['admin', 'administrator', 'mod', 'moderator', 'help', 'contact', 'anonymous', 'anon', 'root', 'owner'];

			let email = req.body.email.trim().toLowerCase();
			let username = req.body.username.trim().toLowerCase();
			let password = req.body.password;
	
			let isValidEmail = validator.isEmail(email);
			let isValidUsername = validator.isLength(username, {min: 3, max: 20 }) && validator.isAlphanumeric(username) && !forbiddenUsernames.includes(username);
	
			if(!isValidEmail || !isValidUsername) {
				catchError(res, 'Invalid email or username supplied.');
				return;
			}

			//Check for existing username or email match
			db.User.findOne({
				where: getWhereForEmailUsernameMatch(db, email, username)
			})
			.then(dbExistingUser => {
				if(dbExistingUser) {
					catchError(res, dbExistingUser.Email === email
						? 'Email is already in use. Please log in with your existing account or reset your password.'
						: 'Username is already in use. Please choose another username.');
					return;
				}

				//Check for disposable email
				isEmailAcceptable(email, (isAcceptable) => {
					if(!isAcceptable) {
						catchError(res, 'Disposable emails are not allowed. Please enter another email address.');
						return;
					}

					//Checks if password valid too
					auth.hashPassword(password, (error, hashedPassword) => {
						if(error || !hashedPassword) {
							//don't give password error details
							catchError(res, 'Invalid password supplied.', db);
							return;
						}

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
					});
				});
			})
			.catch(error => catchError(res, error, db));
		},

		verifyAccount: (req, res, db) => {
			let token = req.body.token;

			db.User.findOne({
				where: {
					VerificationToken: token
				}
			})
			.then((dbUser) => {
				if(!dbUser) {
					catchError(res, 'Account verification failed.');
					return;
				}
				
				dbUser.VerificationToken = null;
				dbUser.save()
					.then(() => {
						auth.getUserJwtResult(dbUser, userResult => res.json(userResult));
					})
					.catch(error => catchError(res, error, db));

				//Also add a welcome notification
				db.Notification.findOne({
					where: {
						IsWelcomeNotification: true
					}
				})
				.then(dbWelcomeNotificaton => {
					if(dbWelcomeNotificaton) {
						db.UserNotification.create({
							NotificationId: dbWelcomeNotificaton.NotificationId,
							UserId: dbUser.UserId
						});
					}
				})
				.catch(error => catchError(res, error, db));
			});
		},
	
		forgotPassword: (req, res, db) => {
			let emailUsername = req.body.emailUsername.trim().toLowerCase();

			let now = new Date();

			let userWhere = getWhereForEmailUsernameMatch(db, emailUsername, emailUsername);

			db.User.findOne({
				where: {
					...userWhere,
					VerificationToken: {
						[db.op.eq]: null
					},
					PasswordResetAt: { //Don't let someone request a password if a request is already in progress
						[db.op.or]: {
							[db.op.lte]: moment(now).subtract(ACCOUNT_VERIFICATION_TOKEN_RESET_HOURS, 'hours').toDate(),
							[db.op.eq]: null
						}
					}
				}
			})
			.then(dbUser => {
				if(dbUser) {
					let passwordResetToken = auth.getHexToken();
					dbUser.PasswordResetToken = passwordResetToken;
					dbUser.PasswordResetAt = now;
					dbUser.save();

					mailer.sendForgotPasswordEmail(dbUser.Email, dbUser.Username, passwordResetToken);
				} else {
					// mailer.sendForgotPasswordNoAccountEmail(dbUser.Email);
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

			if(!token) {
				catchError(res, 'This password reset request is invalid or has expired.');
				return;
			}
			
			db.User.findOne({
				where:{
					PasswordResetAt: {
						[db.op.lte]: moment(now).add(ACCOUNT_VERIFICATION_TOKEN_RESET_HOURS, 'hours').toDate()
					},
					PasswordResetToken: token
				}
			})
			.then(dbUser => {
				if(!dbUser) {
					catchError(res, 'This password reset request is invalid or has expired.');
					return;
				}

				auth.hashPassword(password, (error, hashedPassword) => {
					if(error || !hashedPassword) {
						//don't give password error details
					   catchError(res, 'Invalid password supplied.', db);
					   return;
					}

					dbUser.Password = hashedPassword;
					dbUser.PasswordResetAt = null;
					dbUser.PasswordResetToken = null;
					dbUser.save()
						.then(() => auth.getUserJwtResult(dbUser, userResult => res.json(userResult))) //Wait for this save in case it fails
						.catch(error => catchError(res, error, db));
				});
			})
			.catch(error => catchError(res, error, db));
		},

		getComicById: (req, res, db) => {
			let userId = req.userId; //Might be null
			let comicId = req.body.comicId;

			db.Comic.findOne({
				where: {
					ComicId: comicId
				},
				include: getIncludeForComic(db, userId)
			})
			.then(dbComic => {
				if(dbComic) {
					if(dbComic.CompletedAt) {
						res.json({
							isComicCompleted: true,
							comic: mapper.fromDbComic(dbComic)
						});
					} else {
						res.json({
							isComicCompleted: false,
							totalPanelCount: dbComic.PanelCount,
							completedPanelCount: (dbComic.ComicPanels || []).length
						});
					}
				} else {
					catchError(res, 'Comic not found.', db);
				}
			})
			.catch(error => catchError(res, error, db));
		},
		
		getComics: (req, res, db) => {
			let userId = req.userId; //Might be null

			let templateId = req.body.templateId;
			let authorUserId = req.body.authorUserId;

			let ignoreComicIds = req.body.ignoreComicIds || [];
			let completedAtBefore = req.body.completedAtBefore || new Date();
			let includeAnonymous = req.body.includeAnonymous;
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
			comicOrder.push([ 'CompletedAt', 'DESC' ]);//Thenby

			let comicWhere = {
				CompletedAt: {
					[db.op.ne]: null,
					[db.op.lte]: completedAtBefore
				},
				ComicId: { //Code below (comicWhere.ComicId = ) relies on this being present
					[db.op.notIn]: ignoreComicIds
				}
			};
			if(templateId) comicWhere.TemplateId = templateId;
			if(!includeAnonymous) comicWhere.HasAnonymous = false;
			
			new Promise((resolve, reject) => {
				if(!authorUserId) {
					resolve();
				} else {
					//If we have an authoruserid, find their panels and their comicids
					db.ComicPanel.findAll({
						where: {
							UserId: authorUserId
						}
					})
					.then(dbComicPanels => {
						let comicIds = dbComicPanels.map(dbComicPanel => dbComicPanel.ComicId);
						
						comicWhere.ComicId = {
							...comicWhere.ComicId,
							[db.op.in]: comicIds
						};

						resolve();
					})
					.catch(error => reject(error));
				}
			})
			.then(() => {
				db.Comic.findAll({
					where: comicWhere,
					order: comicOrder,
					offset: offset,
					limit: limit,
					include: getIncludeForComic(db, userId)
				})
				.then(dbComics => res.json(dbComics.map(dbComic => mapper.fromDbComic(dbComic))))
				.catch(error => catchError(res, error, db));
			})
			.catch(error => catchError(res, error, db));
		},

		getTopComics: (req, res, db) => {
			let userId = req.userId;

			db.Comic.findAll({
				where: {
					CompletedAt: {
						[db.op.ne]: null
					}
				},
				// a newer comic tie will beat an older comic (it got more ratings in shorter time)
				order: [[ 'CompletedAt', 'DESC' ]]
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
					include: getIncludeForComic(db, userId, true)
				})
				.then(dbComicsWithInclude => res.json(dbComicsWithInclude.map(mapper.fromDbComic)))
				.catch(error => catchError(res, error, db));
			})
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
				if(!dbUser) {
					catchError(res, 'User not found.');
					return false;
				}

				//Calculate their panel points TODO make a worker service and set points on user row
				//That way we can have leaderboards etc
				db.ComicPanel.findAll({
					where: {
						UserId: requestedUserId
					}
				})
				.then(dbComicPanels => {
					let comicIds = dbComicPanels.map(dbComicPanel => dbComicPanel.ComicId);

					db.Comic.findAll({
						where: {
							ComicId: {
								[db.op.in]: comicIds
							},
							CompletedAt: {
								[db.op.ne]: null
							}
						}
					})
					.then(dbComics => {
						let comicTotalRating = dbComics.reduce((total, item) => total + item.Rating, 0);
						res.json({
							user: mapper.fromDbUser(dbUser, true),
							userStats: {
								panelCount: dbComicPanels.length,
								comicCount: dbComics.length,
								comicTotalRating: comicTotalRating,
							}
						});
					})
					.catch(error => catchError(res, error, db));
				})
				.catch(error => catchError(res, error, db));
			})
			.catch(error => catchError(res, error, db));
		},

		getComicsInProgressCount: (req, res, db) => {
			db.Comic.findAll({
				where: {
					CompletedAt: {
						[db.op.eq]: null
					},
					LastAuthorUserId: {
						[db.op.ne]: null
					}
				}
			})
			.then(dbComics => res.json(dbComics.length))
			.catch(error => catchError(res, error, db));
		},

		//Gets a comic in progress or starts new
		play: (req, res, db) => {
			let userId = req.userId;
			let anonId = req.anonId;

			if(!userId && !anonId) {
				catchError(res, 'No userId supplied');
				return;
			}

			let skippedComicId = req.body.skippedComicId;
			let templateId = userId ? req.body.templateId : null; //Anon users can't target a template
		
			let comicWhere = {
				CompletedAt: {
					[db.op.eq]: null //Incomplete comics
				},
				LockedAt: { //That aren't in the lock window (currently being edited)
					[db.op.or]: {
						[db.op.lte]: getComicLockWindow(),
						[db.op.eq]: null
					}
				}
			};

			//Where I wasn't the last author
			if(userId) {
				comicWhere.HasAnonymous = false;
				comicWhere.LastAuthorUserId = {
					[db.op.or]: {
						[db.op.ne]: userId,
						[db.op.eq]: null
					}
				}
			} else {
				comicWhere.HasAnonymous = true;
				comicWhere.LastAuthorAnonId = {
					[db.op.or]: {
						[db.op.ne]: anonId,
						[db.op.eq]: null
					}
				}
			}
		
			if(templateId) comicWhere.TemplateId = templateId;
			if(skippedComicId) {
				//Don't bring back the same comic we just skipped
				comicWhere.ComicId = {
					[db.op.ne]: skippedComicId
				};
			}

			let comicOrder = [];
			// if(userId) comicOrder.push([ 'HasAnonymous', 'ASC' ]);
			comicOrder.push(db.fn('RANDOM'));
		
			//Get random incomplete comic
			db.Comic.findAll({
				limit: 1,
				where: comicWhere,
				include: [{ //Don't return comments, ratings, etc for this one, just panels
					model: db.ComicPanel,
					as: 'ComicPanels'
				}],
				order: comicOrder
			})
			.then(dbComics => {
				let dbComic = dbComics[0];
		
				//Function used below for an existing or new comic
				const prepareComicForPlay = (dbComic) => {
					return new Promise((resolve, reject) => {
						let completedComicPanels = dbComic.ComicPanels || [];
						let currentComicPanel = completedComicPanels.length > 0
							? completedComicPanels.sort((cp1, cp2) => cp1.Ordinal - cp2.Ordinal)[completedComicPanels.length - 1]
							: null;
						let isFirst = !currentComicPanel;
						let isLast = completedComicPanels.length + 1 === dbComic.PanelCount;
							
						let templatePanelWhere = {
							TemplateId: dbComic.TemplateId
						};
		
						//Certain panels only show up in the first or last position
						isFirst
							? templatePanelWhere.IsNeverFirst = false
							: templatePanelWhere.IsOnlyFirst = false;
		
						isLast
							? templatePanelWhere.IsNeverLast = false
							: templatePanelWhere.IsOnlyLast = false;
		
						db.TemplatePanel.findAll({
							limit: 1,
							order: [db.fn('RANDOM')],
							where: templatePanelWhere
						})
						.then(dbTemplatePanels => {
							let dbTemplatePanel = dbTemplatePanels[0];
		
							dbComic.NextTemplatePanelId = dbTemplatePanel.TemplatePanelId;

							//Lock the comic
							dbComic.LockedAt = new Date();
							if(userId) {
								dbComic.LockedByUserId = userId;
							} else {
								dbComic.LockedByAnonId = anonId;
							}
		
							dbComic.save()
								.then(() => resolve({
									comicId: dbComic.ComicId,
									templatePanelId: dbTemplatePanel.TemplatePanelId,
		
									totalPanelCount: dbComic.PanelCount,
									completedPanelCount: completedComicPanels.length,
		
									currentComicPanel: currentComicPanel 
										? mapper.fromDbComicPanel(currentComicPanel) 
										: null
								}))
								.catch(error => reject(error));
		
						})
						.catch(err => reject(err));
					});
				};
		
				if(dbComic) {
					prepareComicForPlay(dbComic)
						.then(result => res.json(result))
						.catch(error => catchError(res, error, db));
				} else {
					db.Template.findAll({
						limit: 10, //10 keeps the latest templates in circulation, while still having variety
						//If a templateId is supplied, only 1 will be returned and the random below will select it
						where: getWhereForUnlockedTemplates(db, templateId),
						order: [[ 'UnlockedAt', 'DESC' ]]
					})
					.then((dbLatestTemplates) => {
						//Anonymous users can't access the latest template right away
						let dbTemplate = dbLatestTemplates[getRandomInt((userId ? 0 : 1), dbLatestTemplates.length - 1)];
		
						//Create a new comic with this template
						db.Comic.create({
							TemplateId: dbTemplate.TemplateId,
							PanelCount: getRandomPanelCount(dbTemplate.MaxPanelCount),
							HasAnonymous: !userId
						})
						.then(dbNewComic => {
							prepareComicForPlay(dbNewComic)
								.then(result => res.json(result))
								.catch(error => catchError(res, error, db));
						})
						.catch(error => catchError(res, error, db));
					})
					.catch(error => catchError(res, error, db));
				}
		
				//Process skipped comic (needs to happen after the query above)
				if(skippedComicId) {
					skippedComicWhere = {
						ComicId: skippedComicId
					}

					//Important! without this anyone can clear any lock and PRETEND to skip a whole bunch
					if(userId) {
						skippedComicWhere.LockedByUserId = userId
					} else {
						skippedComicWhere.LockedByAnonId = anonId;
					}

					//Remove the lock on the comic
					db.Comic.update({
						LockedAt: null,
						LockedByUserId: null,
						LockedByAnonId: null,
						NextTemplatePanelId: null
					}, {
						where: skippedComicWhere
					})
					.then(([affectedRows]) => {
						//Should never be > 1: comicId alone should assure that, but in the case of 0 affected rows....
						if(affectedRows !== 1) {
							//Invalid lock/id. Bail right out here.
							catchError(res, `${userId || 'anon'} tried to illegally skip comic ${skippedComicId}`, db);
							return;
						}
						
						if(userId) {
							//Find the current comic panel
							db.ComicPanel.findAll({
								where: {
									ComicId: skippedComicId
								},
								limit: 1,
								order: [['Ordinal', 'DESC']]
							})
							.then(dbComicPanels => {
								//There may be no panels (if the user skipped at the BEGIN COMIC stage)
								if(dbComicPanels && dbComicPanels.length === 1) {
									let currentComicPanel = dbComicPanels[0];

									//Record a panelskip. if this is created (not found) we need to increase skipcount
									db.ComicPanelSkip.findOrCreate({
										where: {
											UserId: userId,
											ComicPanelId: currentComicPanel.ComicPanelId
										}
									})
									.then(([dbComicPanelSkip, wasCreated]) => {
										if(wasCreated) {
											//If this was my first skip of this comic panel, increase skipcount
											let newSkipCount = currentComicPanel.SkipCount + 1;
											if(newSkipCount > COMIC_PANEL_SKIP_LIMIT) {
												//No need to update skip count, the archived state indicates the total count is limit + 1;
												if(currentComicPanel.UserId) createNotifications(db, [currentComicPanel.UserId], 'Panel removed...', `Sorry, a panel you made for comic #${currentComicPanel.ComicId} was skipped by too many users and has been removed. Your dialogue was: "${currentComicPanel.Value}"`);
												currentComicPanel.destroy();
											} else {
												currentComicPanel.SkipCount = newSkipCount;
												currentComicPanel.save();
											}
										}
									})
									.catch(error => catchError(res, error, db));
								}
							})
							.catch(error => catchError(res, error, db));
						}
					});
				}
			})
			.catch(error => catchError(res, error, db));
		},
		
		submitComicPanel: (req, res, db) => {
			let userId = req.userId;
			let anonId = req.anonId;

			let comicId = req.body.comicId;
			let dialogue = req.body.dialogue;

			let comicWhere = {
				ComicId: comicId, //Find the comic
				CompletedAt: {
					[db.op.eq]: null // that is incomplete
				},
				LockedAt: {
					[db.op.gte]: getComicLockWindow() //and the lock is still valid
				}
			};
			//and the lock is held by me
			if(userId) {
				comicWhere.LockedByUserId = userId;
			} else {
				comicWhere.LockedByAnonId = anonId;
			}
		
			db.Comic.findOne({
				where: comicWhere,
				include: getIncludeForComic(db)
			})
			.then(dbComic => {
				if(!dbComic) {
					catchError(res, 'Invalid comic submitted.');
					return;
				}
	
				let isDialogueValid = validator.isLength(dialogue, { min: 1, max: 255 });
				let isComicValid = dbComic.CompletedAt === null && dbComic.ComicPanels.length < dbComic.PanelCount;
		
				if(!isComicValid || !isDialogueValid) {
					catchError(res, 'Invalid dialogue supplied.');
					return;
				}
				
				db.ComicPanel.create({
					TemplatePanelId: dbComic.NextTemplatePanelId,
					ComicId: dbComic.ComicId,
					Value: dialogue,
					Ordinal: dbComic.ComicPanels.length + 1,
					UserId: userId //Might be null if anon
				})
				.then(() => {
					let completedPanelCount = (dbComic.ComicPanels.length + 1);
					let isComicCompleted = completedPanelCount === dbComic.PanelCount;
					
					if(isComicCompleted) {
						let now = new Date();
						dbComic.CompletedAt = now;
	
						//Notify other panel creators, but not this one.
						let notifyUserIds = dbComic.ComicPanels.filter(cp => !!cp.UserId).map(cp => cp.UserId).filter(uId => uId !== userId);
						createNotifications(db, notifyUserIds, `Comic #${dbComic.ComicId} completed!`, `A comic you made a panel for has been completed. Click here to view the comic.`, dbComic.ComicId);
					}
	
					//Remove the lock
					dbComic.LockedAt = null;
					dbComic.LockedByUserId = null;
					dbComic.LockedByAnonId = null;

					//Record me as last author
					if(userId) {
						dbComic.LastAuthorUserId = userId;
						dbComic.LastAuthorAnonId = null;
					} else {
						dbComic.LastAuthorAnonId = anonId;
						dbComic.LastAuthorUserId = null;
					}

					dbComic.save()
						.then(() => {
							res.json({ 
								success: true, 
								isComicCompleted: isComicCompleted
							});
						})
						.catch(error => catchError(res, error, db));
				})
				.catch(error => catchError(res, error, db));
			})
			.catch(error => catchError(res, error, db));
		},
	},

	private: {

		voteComic: (req, res, db) => {
			let userId = req.userId;
			let comicId = req.body.comicId;
			let value = req.body.value;

			//Value can only be 1, 0, -1
			if(value > 1 || value < -1) {
				catchError(res, 'Invalid vote value supplied.', db);
				return;
			}

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
				if(!dbComic) {
					catchError(res, 'Invalid comic ID supplied.', db);
					return;
				}

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
			})
			.catch(error => catchError(res, error, db));
		},

		postComicComment: (req, res, db) => {
			let userId = req.userId;

			let comicId = req.body.comicId;
			let value = req.body.value;

			db.Comic.findOne({
				where: {
					ComicId: comicId,
					CompletedAt: {
						[db.op.ne]: null
					}
				}
			})
			.then(dbComic => {
				if(!dbComic) {
					catchError(res, 'Invalid comic to comment on', db);
					return;
				}

				db.ComicComment.create({
					UserId: userId,
					ComicId: comicId,
					Value: value
				})
				.then(dbCreatedComicComment => res.json(mapper.fromDbComicComment(dbCreatedComicComment)))
				.catch(error => catchError(res, error, db));
			});
		},

		deleteComicComment: (req, res, db) => {
			let userId = req.userId;

			let comicCommentId = req.body.comicCommentId;

			db.ComicComment.destroy({
				where: {
					UserId: userId, //Validation
					ComicCommentId: comicCommentId
				}
			});

			res.json({ success: true });
		},

		getNotifications: (req, res, db) => {
			let userId = req.userId;

			let lastCheckedAt = req.body.lastCheckedAt;

			let notificationWhere = {
				UserId: userId
			};

			if(lastCheckedAt) {
				notificationWhere = {
					...notificationWhere,
					CreatedAt: {
						[db.op.gte]: lastCheckedAt
					}
				};
			} else {
				//First request
				notificationWhere = {
					...notificationWhere,
					[db.op.or]: [{
						CreatedAt: {
							[db.op.gte]: moment().subtract(2, 'days').toDate()
						}
					}, {
						SeenAt: {
							[db.op.eq]: null
						}
					}]
				};
			}

			db.UserNotification.findAll({
				where: notificationWhere,
				include: [{
					model: db.Notification,
					as: 'Notification'
				}]
			})
			.then(dbUserNotifications => res.json(dbUserNotifications.map(mapper.fromDbUserNotification)))
			.catch(error => catchError(res, error, db));
		},

		seenNotifications: (req, res, db) => {
			let userId = req.userId;
			let userNotificationIds = req.body.userNotificationIds;

			db.UserNotification.update({
				SeenAt: new Date()
			}, {
				where: {
					SeenAt: {
						[db.op.eq]: null
					},
					UserId: userId,
					UserNotificationId: {
						[db.op.in]: userNotificationIds
					}
				}
			});

			res.json({ success: true });
		},

		actionedUserNotification: (req, res, db) => {
			let userId = req.userId;
			let userNotificationId = req.body.userNotificationId;

			db.UserNotification.update({
				ActionedAt: new Date()
			}, {
				where: {
					ActionedAt: {
						[db.op.eq]: null
					},
					UserId: userId,
					UserNotificationId: userNotificationId
				}
			});

			res.json({ success: true });
		},

		saveAvatar: (req, res, db) => {
			let userId = req.userId;
			
			let avatar = req.body.avatar;

			//If someone sends up bad values for these it doesn't do anything breaky
			db.User.update({
				AvatarExpression: avatar.expression,
				AvatarCharacter: avatar.character,
				AvatarColour: avatar.colour
			}, {
				where: {
					UserId: userId
				}
			})
			.then(() => res.json({ success: true }))
			.catch(error => catchError(res, error, db));
		},

		changePassword: (req, res, db) => {
			//Must be logged in
			let userId = req.userId;

			let currentPassword = req.body.currentPassword;
			let newPassword = req.body.newPassword;
			
			db.User.findOne({
				where: {
					UserId: userId
				}
			})
			.then(dbUser => {
				if(!dbUser) {
					catchError(res, 'User not found.');
					return;
				}

				bcrypt.compare(currentPassword, dbUser.Password).then(isMatch => {
					if(isMatch) {
						auth.hashPassword(newPassword, (error, hashedPassword) => {
							if(error || !hashedPassword) {
								//don't give password error details
							   catchError(res, 'Invalid password supplied.', db);
							   return;
							}
		
							dbUser.Password = hashedPassword;
							dbUser.save()
								.then(() => res.json({ success: true})) //Wait for this save in case it fails
								.catch(error => catchError(res, error, db));
						});
					} else {
						//Invalid password
						catchError(res, 'Invalid current password.');
					}
				});
			})
			.catch(error => catchError(res, error, db));
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

		
		// changeUsername: (req, res, db) => {
		// 	let userId = req.userId;
	
		// 	let username = req.body.username.trim().toLowerCase();
		// 	let isValidUsername = validator.isLength(username, { min: 3, max: 20 });
	
		// 	if(isValidUsername) {
		// 		db.User.findOne({
		// 			where: getWhereForEmailUsernameMatch(db, null) ??? todo
		// 		})
		// 		.then(dbExistingUser => {
		// 			if(!dbExistingUser) {
		// 				db.User.update({
		// 					Username: username,
		// 					VerificationToken: {
		// 						[db.op.eq]: null
		// 					}
		// 				}, {
		// 					where: {
		// 						UserId: userId
		// 					}
		// 				})
		// 			} else {
		
		// 			}
		// 		});
		// 	} else {
		// 		catchError(res, 'Invalid username supplied.', db);
		// 	}
		// },
	}
};

module.exports = routes;