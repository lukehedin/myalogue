const enums = require('./enums');
const error = require('./error');

const notifier = {
	
	_cleanNotifyUserIds: (notifyUserIds) => {
		//Unique-ify and filter any null, undefined, 0 etc
		return [...new Set(notifyUserIds)].filter(notifyUserId => !!notifyUserId && !isNaN(notifyUserId));
	},

	_createSingletonNotification: (db, notifyUserIds, type, valueInteger = null, valueString = null) => {
		//Only ONE type of each of these in the db, with no foreign keys. Uses findorcreate.
		//Use this for notifications that don't change content from user to user (apart from valueinteger/valuestring)
	
		notifyUserIds = notifier._cleanNotifyUserIds(notifyUserIds);

		db.Notification.findOrCreate({
			where: {
				Type: type
			}
		})
		.then(([dbNotification]) => {
			db.UserNotification.bulkCreate(notifyUserIds.map(notifyUserId => {
				return {
					UserId: notifyUserId,
					NotificationId: dbNotification.NotificationId,
					ValueInteger: valueInteger,
					ValueString: valueString
				};
			}));
		})
		.catch(err => error.logError(err, db));
	},

	_createNotification: (db, notifyUserIds, type, relatedFields, valueInteger = null, valueString = null) => {
		//The most basic notification operation. creates a notification, makes usernotifications
		//Does not update further. No chance of overlapping or sending twice.
	
		notifyUserIds = notifier._cleanNotifyUserIds(notifyUserIds);
		
		if(!relatedFields) relatedFields = {};
		
		db.Notification.create({
			Type: type,
			//Related data, might all be null
			ComicId: relatedFields.comicId,
			UserId: relatedFields.userId
		})
		.then(dbNotification => {
			db.UserNotification.bulkCreate(notifyUserIds.map(userId => {
				return {
					NotificationId: dbNotification.NotificationId,
					UserId: userId,
					ValueInteger: valueInteger,
					ValueString: valueString
				};
			}));
		})
		.catch(err => error.logError(err, db));
	},

	sendWelcomeNotification: (db, userId) => {
		notifier._createSingletonNotification(db, [userId], enums.NotificationType.Welcome);
	},

	sendPanelRemovedNotification: (db, dbComicPanel) => {
		notifier._createSingletonNotification(db, [dbComicPanel.UserId], enums.NotificationType.PanelRemoved, dbComicPanel.ComicId, dbComicPanel.Value);
	},

	sendComicCompletedNotification: (db, notifyUserIds, comicId) => {
		notifier._createNotification(db, notifyUserIds, enums.NotificationType.ComicCompleted, { comicId: comicId });
	},

	sendComicCommentNotification: (db, dbNewComicComment, dbComic) => {
		//NOTE: dbComic's ComicComments should not have the dbNewComicComment in them

		// This is an updatable user notification as further comments happen. 
		// if the user HASN'T seen the notification, the valueinteger may increase (eg. "bob and 2 others" becomes "sarah and 3 others")
		// if the user has seen the notification, a new one is made. (eg. "sarah commented")
		// A SEEN NOTIFICATION SHOULD NEVER CHANGE

		//dbComic needs to have panels and comments with it
		let commenterUserId = dbNewComicComment.UserId;

		//The userIds to send notifications to: all commenters and panel authors
		let notifyUserIds = notifier._cleanNotifyUserIds([
				...dbComic.ComicComments.map(dbComicComment => dbComicComment.UserId), 
				...dbComic.ComicPanels.map(dbComicPanel => dbComicPanel.UserId)
			].filter(userId => userId !== commenterUserId) //DO NOT include THIS commenter
		);
		
		// Find or create a comment notification for this comicid
		Promise.all([
			db.Notification.findOrCreate({
				where: {
					Type: enums.NotificationType.ComicComment,
					ComicId: dbComic.ComicId
				}
			}),
			db.User.findOne({
				where: {
					UserId: commenterUserId
				}
			})
		])
		.then(([[dbNotification, wasCreated], dbNewCommenterUser])  => {
			if(wasCreated) {
				//We just made the root comment notification, so make all the user ones now
				db.UserNotification.bulkCreate(notifyUserIds.map(notifyUserId => {
					return {
						UserId: notifyUserId,
						NotificationId: dbNotification.NotificationId,
						ValueString: dbNewCommenterUser.Username,
						ValueInteger: null
					};
				}));
			} else {
				//Get the existing user notifciations for this comic comment notification
				db.UserNotification.findAll({
					where: {
						NotificationId: dbNotification.NotificationId
					}
				})
				.then(dbUserNotifications => {
					let userNotificationsToCreate = [];
					let now = new Date();
					
					//For each user we're notifying
					notifyUserIds.forEach(notifyUserId => {
						//This may be filled with a date to limit how many "and 2 others" shows up
						let otherCommentsCutoffDate = null;

						//Get all MY comments, if any
						let dbCommentsForUser = dbComic.ComicComments
							.filter(dbComicComment => dbComicComment.UserId === notifyUserId)
							.sort((c1, c2) => new Date(c2.CreatedAt) - new Date(c1.CreatedAt));
						//If I made any comments, make sure my notification only counts additional ones
						if(dbCommentsForUser && dbCommentsForUser.length > 0) otherCommentsCutoffDate = dbCommentsForUser[0].CreatedAt;

						//Get all comments but my own and the recent commeneter. Might be 0.
						let dbOtherComicComments = dbComic.ComicComments
							.filter(dbComicComment => dbComicComment.UserId !== notifyUserId && dbComicComment.UserId !== dbNewCommenterUser.UserId)
							.filter(dbComicComment => {
								return otherCommentsCutoffDate 
									? new Date(dbComicComment.CreatedAt) > new Date(otherCommentsCutoffDate) 
									: null;
							});
							
						//Get all user notifications i've already gotten for this comment thread
						let dbUserNotificationsForUser = dbUserNotifications
							.filter(dbUserNotification => dbUserNotification.UserId === notifyUserId)
							.sort((n1, n2) => new Date(n2.CreatedAt) - new Date(n1.CreatedAt));

						if(dbUserNotificationsForUser && dbUserNotificationsForUser.length > 0) {
							let latestDbUserNotificationForUser = dbUserNotificationsForUser[0];

							if(latestDbUserNotificationForUser.SeenAt) {
								//HAS seen the latest notification. Make a new one, with only commenters AFTER my latest notifications's SeenAt
								userNotificationsToCreate.push({
									UserId: notifyUserId,
									NotificationId: dbNotification.NotificationId,
									ValueString: dbNewCommenterUser.Username,
									ValueInteger: [...new Set(dbOtherComicComments
											.filter(dbComicComment => new Date(dbComicComment.CreatedAt) > new Date(latestDbUserNotificationForUser.SeenAt))
											.map(dbComicComment => dbComicComment.UserId)
										)].length
								});
							} else {
								//Hasn't seen the latest notification, update it's data
								userNotificationsToCreate.push({
									//Including THIS makes it an update
									UserNotificationId: latestDbUserNotificationForUser.UserNotificationId,
									
									RenewedAt: now,
									ValueString: dbNewCommenterUser.Username,
									ValueInteger: [...new Set(dbOtherComicComments.map(dbComicComment => dbComicComment.UserId))].length
								});
							}
						} else {
							//Notifying someone who hasn't got a usernotification for this thread yet
							//Eg. the person who commented first, OR someone who joined a random comment thread

							userNotificationsToCreate.push({
								UserId: notifyUserId,
								NotificationId: dbNotification.NotificationId,
								ValueString: dbNewCommenterUser.Username,
								ValueInteger: [...new Set(dbOtherComicComments.map(dbComicComment => dbComicComment.UserId))].length
							});
						}
					});

					db.UserNotification.bulkCreate(userNotificationsToCreate, {
						updateOnDuplicate: ['ValueString', 'ValueInteger', 'RenewedAt', 'UpdatedAt']
					});
				})
				.catch(err => error.logError(err, db));
			}
		})
		.catch(err => error.logError(err, db));
	},
};

module.exports = notifier;