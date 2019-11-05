import Sequelize from 'sequelize';
import moment from 'moment';
import common from '../common';
import mapper from '../mapper';

import Service from './Service';

export default class NotificationService extends Service {
	async GetNotificationsForUserId(userId, lastCheckedAt) {
		let userNotificationWhere = {
			UserId: userId
		};

		if(lastCheckedAt) {
			userNotificationWhere = {
				...userNotificationWhere,
				UpdatedAt: {
					[Sequelize.Op.gte]: lastCheckedAt
				}
			};
		} else {
			//First request
			userNotificationWhere = {
				...userNotificationWhere,
				[Sequelize.Op.or]: [{
					UpdatedAt: {
						[Sequelize.Op.gte]: moment().subtract(1, 'day').toDate()
					}
				}, {
					SeenAt: {
						[Sequelize.Op.eq]: null
					}
				}]
			};
		}

		let dbUserNotifications = await this.models.UserNotification.findAll({
			where: userNotificationWhere,
			include: [{
				model: this.models.Notification,
				as: 'Notification'
			}]
		});

		return dbUserNotifications.map(mapper.fromDbUserNotification);
	}
	async SendWelcomeNotification(userId) {
		await this._CreateSingletonNotification([userId], common.enums.NotificationType.Welcome);
	}
	async SendPanelRemovedNotification(dbComicPanel) {
		await this._CreateSingletonNotification([dbComicPanel.UserId], common.enums.NotificationType.PanelRemoved, dbComicPanel.ComicId, dbComicPanel.Value);
	}
	async SendPanelCensoredNotification (dbComicPanel) {
		await this._CreateSingletonNotification([dbComicPanel.UserId], common.enums.NotificationType.PanelCensored, dbComicPanel.ComicId, dbComicPanel.Value);
	}
	async SendComicCompletedNotification(notifyUserIds, comicId) {
		await this._CreateNotification(notifyUserIds, common.enums.NotificationType.ComicCompleted, { comicId: comicId });
	}
	async SendComicCommentNotification(dbNewComicComment, dbComic) {
		//dbComic needs to have panels and comments with it
		//NOTE: dbComic's ComicComments should not have the dbNewComicComment in them

		// This is an updatable user notification as further comments happen. 
		// if the user HASN'T seen the notification, the valueinteger may increase (eg. "bob and 2 others" becomes "sarah and 3 others")
		// if the user has seen the notification, a new one is made. (eg. "sarah commented")
		// A SEEN NOTIFICATION SHOULD NEVER CHANGE

		let commenterUserId = dbNewComicComment.UserId;
		let dbNewCommenterUser = await this.models.User.findOne({
			where: {
				UserId: commenterUserId
			}
		});

		//Find any users mentioned in this comment, and send them a specific notification
		//They are also filtered out of the general notification below
		let userMentionUserIds = await this._GetUserMentionUserIds(dbNewComicComment.Value);
		this.SendComicCommentMentionedNotification(userMentionUserIds, dbNewCommenterUser, dbComic.ComicId);

		//The userIds to send notifications to: all commenters and panel authors
		let notifyUserIds = this._CleanNotifyUserIds([
				...dbComic.ComicComments.map(dbComicComment => dbComicComment.UserId), 
				...dbComic.ComicPanels.map(dbComicPanel => dbComicPanel.UserId)
			]
			.filter(userId => !userMentionUserIds.includes(userId)) //DO NOT include users mentioned in this comment, they get a direct notification
			.filter(userId => userId !== commenterUserId) //DO NOT include THIS commenter
		);
		
		// Find or create a comment notification for this comicid
		let [dbNotification, wasCreated] = await this.models.Notification.findOrCreate({
			where: {
				Type: common.enums.NotificationType.ComicComment,
				ComicId: dbComic.ComicId
			}
		});

		if(wasCreated) {
			//We just made the root comment notification, so make all the user ones now
			this.models.UserNotification.bulkCreate(notifyUserIds.map(notifyUserId => {
				return {
					UserId: notifyUserId,
					NotificationId: dbNotification.NotificationId,
					ValueString: dbNewCommenterUser.Username,
					ValueInteger: null
				};
			}));
		} else {
			let userNotificationsToCreate = []; //Some of these may be updates (using PK)
			let now = new Date();

			//Get the existing user notifciations for this comic comment notification
			let dbUserNotifications = await this.models.UserNotification.findAll({
				where: {
					NotificationId: dbNotification.NotificationId
				}
			});
				
			//For each user we're notifying
			notifyUserIds.forEach(notifyUserId => {
				//This may be filled with a date to limit how many "and 2 others" shows up
				let otherCommentsCutoffDate = null;

				//Get all MY comments, if any
				let dbCommentsForUser = dbComic.ComicComments
					.filter(dbComicComment => dbComicComment.UserId === notifyUserId)
					.sort((c1, c2) => new Date(c2.CreatedAt) - new Date(c1.CreatedAt));
				//If I made any comments, make sure my notification only counts the ones AFTER my latest comment
				if(dbCommentsForUser && dbCommentsForUser.length > 0) otherCommentsCutoffDate = dbCommentsForUser[0].CreatedAt;

				//Get all comments but my own and the recent commenter. Might be 0.
				let dbOtherComicComments = dbComic.ComicComments
					.filter(dbComicComment => dbComicComment.UserId !== notifyUserId && dbComicComment.UserId !== dbNewCommenterUser.UserId)
					.filter(dbComicComment => {
						return otherCommentsCutoffDate 
							? new Date(dbComicComment.CreatedAt) > new Date(otherCommentsCutoffDate) //if we have a cuttoff date, i only care about comments after it
							: true; //otherwise i care about all!
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

			await this.models.UserNotification.bulkCreate(userNotificationsToCreate, {
				updateOnDuplicate: ['ValueString', 'ValueInteger', 'RenewedAt', 'UpdatedAt']
			});
		}
	}
	async SendComicCommentMentionedNotification(mentionedUserIds, dbNewCommenterUser, comicId) {
		if(!mentionedUserIds || mentionedUserIds.length < 1) return;

		let notifyUserIds = this._CleanNotifyUserIds(mentionedUserIds)
			.filter(userId => userId !== dbNewCommenterUser.UserId); // you can't mention yourself!

		// Find or create a comment notification for this comicid
		let [dbNotification, wasCreated] = await this.models.Notification.findOrCreate({
			where: {
				Type: common.enums.NotificationType.ComicCommentMention,
				ComicId: comicId
			}
		});

		//Make all the user ones now
		this.models.UserNotification.bulkCreate(notifyUserIds.map(notifyUserId => {
			return {
				UserId: notifyUserId,
				NotificationId: dbNotification.NotificationId,
				ValueString: dbNewCommenterUser.Username,
				ValueInteger: null
			};
		}));
	}
	SeenUserNotificationsByIds(userId, userNotificationIds) {
		this.models.UserNotification.update({
			SeenAt: new Date()
		}, {
			where: {
				SeenAt: {
					[Sequelize.Op.eq]: null
				},
				UserId: userId,
				UserNotificationId: {
					[Sequelize.Op.in]: userNotificationIds
				}
			}
		});
	}
	ActionedUserNotificationById(userId, userNotificationId) {
		this.models.UserNotification.update({
			ActionedAt: new Date()
		}, {
			where: {
				ActionedAt: {
					[Sequelize.Op.eq]: null
				},
				UserId: userId,
				UserNotificationId: userNotificationId
			}
		});
	}
	async _CreateSingletonNotification(notifyUserIds, type, valueInteger = null, valueString = null) {
		//Only ONE type of each of these in the db, with no foreign keys. Uses findorcreate.
		//Use this for notifications that don't change content from user to user (apart from valueinteger/valuestring)
	
		notifyUserIds = this._CleanNotifyUserIds(notifyUserIds);

		let [dbNotification] = await this.models.Notification.findOrCreate({
			where: {
				Type: type
			}
		});

		this.models.UserNotification.bulkCreate(notifyUserIds.map(notifyUserId => {
			return {
				UserId: notifyUserId,
				NotificationId: dbNotification.NotificationId,
				ValueInteger: valueInteger,
				ValueString: valueString
			};
		}));
	}
	async _CreateNotification(notifyUserIds, type, relatedFields, valueInteger = null, valueString = null) {
		//The most basic notification operation. creates a notification, makes usernotifications
		//Does not update further. No chance of overlapping or sending twice.
	
		notifyUserIds = this._CleanNotifyUserIds(notifyUserIds);
		
		if(!relatedFields) relatedFields = {};
		
		let dbNotification = await this.models.Notification.create({
			Type: type,
			//Related data, might all be null
			ComicId: relatedFields.comicId,
			UserId: relatedFields.userId
		});

		this.models.UserNotification.bulkCreate(notifyUserIds.map(userId => {
			return {
				NotificationId: dbNotification.NotificationId,
				UserId: userId,
				ValueInteger: valueInteger,
				ValueString: valueString
			};
		}));
	}
	async _GetUserMentionUserIds (str) {
		let userMentions = str.match(/\B@[a-z0-9]+/gi);//Regex also on client
		if(!userMentions || userMentions.length < 1) return [];
		
		let usernames = userMentions.map(userMention => userMention.replace('@', ''));
		let dbUsers = await this.services.User.DbGetByUsernames(usernames);
		return [...new Set(dbUsers.map(dbUser => dbUser.UserId))];
	}
	_CleanNotifyUserIds (notifyUserIds) {
		//Unique-ify and filter any null, undefined, 0 etc
		return [...new Set(notifyUserIds)].filter(notifyUserId => !!notifyUserId && !isNaN(notifyUserId));
	}
}