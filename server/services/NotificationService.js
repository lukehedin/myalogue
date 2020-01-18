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
				as: 'Notification',
				include: [{
					model: this.models.Group,
					as: 'Group'
				}]
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
	async SendAchievementUnlockedNotification(notifyUserIds, achievementType) {
		let achievement = this.services.Achievement.GetByType(achievementType);
		await this._CreateSingletonNotification(notifyUserIds, common.enums.NotificationType.AchievementUnlocked, achievementType, achievement.name);
	}
	async SendComicCompletedNotification(notifyUserIds, comicId) {
		await this._CreateNotification(notifyUserIds, common.enums.NotificationType.ComicCompleted, { ComicId: comicId });
	}
	async SendComicCommentNotification(dbNewComicComment) {
		this._CreateOrUpdateCommentNotification(dbNewComicComment, 'ComicComment', common.enums.NotificationType.ComicComment, common.enums.NotificationType.ComicCommentMention, { ComicId: dbNewComicComment.ComicId });
	}
	async SendGroupRequestApprovedNotification(userId, groupId, groupName) {
		//Takes the user to the group page that accepted them
		await this._CreateNotification([userId], common.enums.NotificationType.GroupRequestApproved, { GroupId: groupId }, null, groupName);
	}
	async SendGroupInviteReceivedNotification(userId, groupId, groupName) {
		//Takes the user to their pending requests
		await this._CreateNotification([userId], common.enums.NotificationType.GroupInviteReceived, { GroupId: groupId }, null, groupName);
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
	async _SendCommentMentionedNotification(mentionedUserIds, dbNewCommenterUser, notificationType, notificationProperties = {}) {
		if(!mentionedUserIds || mentionedUserIds.length < 1) return;

		let notifyUserIds = this._CleanNotifyUserIds(mentionedUserIds)
			.filter(userId => userId !== dbNewCommenterUser.UserId); // you can't mention yourself!

		// Find or create a mention notification
		let [dbNotification, wasCreated] = await this.models.Notification.findOrCreate({
			where: {
				Type: notificationType,
				...notificationProperties
			}
		});

		console.log(notificationProperties);

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
	async _CreateOrUpdateCommentNotification(dbNewComment, commentTableName, type, mentionType, notificationProperties = {}){
		//This function will find any mentions within the comment (takes advantage of comment table mutual fiels)
		//and determine who needs to be notified based on the commentTable. eg. ComicComment = use panel creators, GroupComment = group members
		//After that, it will use the generic CreateOrUpdateStackingNotification

		let dbNewCommenterUser = await this.models.User.findOne({
			where: {
				UserId: dbNewComment.UserId
			}
		});

		//Find any users mentioned in this comment, and send them a specific notification
		//They are also filtered out of the general notification below
		let userMentionUserIds = await this._GetUserMentionUserIds(dbNewComment.Value);
		//Thankfully, notificationProperties are the same for comment and mention notifications
		this._SendCommentMentionedNotification(userMentionUserIds, dbNewCommenterUser, mentionType, notificationProperties);

		//All of these are set using the swich below:
		let userIdsInThread = []; //UserIds who CARE about this comment thread (including non-commenters)
		let dbExistingCommentsInThread = null; //SHOULD NOT INCLUDE NEW COMMENT - Comments of the same dbTable type specified in params, that are in the same thread as the new comment

		switch(commentTableName) {
			case 'ComicComment':
				let dbComic = await this.models.Comic.findOne({
					where: {
						ComicId: dbNewComment.ComicId //Extract comicId from dbNewComment, which SHOULD be a ComicComment
					},
					include: [{
						model: this.models.ComicPanel,
						as: 'ComicPanels'
					}, {
						model: this.models.ComicComment,
						as: 'ComicComments'
					}]
				});
				
				//The userIds to send notifications to: all commenters and panel authors
				userIdsInThread = [
					...dbComic.ComicComments.map(dbComicComment => dbComicComment.UserId), 
					...dbComic.ComicPanels.map(dbComicPanel => dbComicPanel.UserId)
				];

				//Important to remove the dbNewComment!
				dbExistingCommentsInThread = dbComic.ComicComments
					.filter(dbComicComment => dbComicComment.ComicCommentId !== dbNewComment.ComicCommentId);

				break;

			case 'GroupComment':
				//TODO
				break;
				
			default:
				throw 'Notification failed, comment table name invalid';
		}

		let notifyUserIds = this._CleanNotifyUserIds(
			userIdsInThread
				.filter(userId => !userMentionUserIds.includes(userId)) //DO NOT include users MENTIONED in this comment, they already got a direct notification
				.filter(userId => userId !== dbNewComment.UserId) //DO NOT include THIS commenter
		)
		
		// Find or create a notification with the parsed in type
		let [dbNotification, dbNotificationWasCreated] = await this.models.Notification.findOrCreate({
			where: {
				Type: type,
				...notificationProperties
			}
		});

		if(dbNotificationWasCreated) {
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

			//Get the existing user notifciations for this notification
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
				let dbCommentsForUser = dbExistingCommentsInThread
					.filter(dbComment => dbComment.UserId === notifyUserId)
					.sort((c1, c2) => new Date(c2.CreatedAt) - new Date(c1.CreatedAt));
				//If I made any comments previously, make sure my notification only counts the ones AFTER my latest comment
				if(dbCommentsForUser && dbCommentsForUser.length > 0) otherCommentsCutoffDate = dbCommentsForUser[0].CreatedAt;
		
				//Get all comments but my own and the recent commenter. Might be 0.
				let dbOtherComments = dbExistingCommentsInThread
					.filter(dbComment => dbComment.UserId !== notifyUserId && dbComment.UserId !== dbNewCommenterUser.UserId)
					.filter(dbComment => {
						return otherCommentsCutoffDate 
							? new Date(dbComment.CreatedAt) > new Date(otherCommentsCutoffDate) //if we have a cuttoff date, i only care about comments after it
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
							ValueInteger: [...new Set(dbOtherComments
									.filter(dbComment => new Date(dbComment.CreatedAt) > new Date(latestDbUserNotificationForUser.SeenAt))
									.map(dbComment => dbComment.UserId)
								)].length
						});
					} else {
						//Hasn't seen the latest notification, update it's data
						userNotificationsToCreate.push({
							//Including THIS makes it an update
							UserNotificationId: latestDbUserNotificationForUser.UserNotificationId,
							
							RenewedAt: now,
							ValueString: dbNewCommenterUser.Username,
							ValueInteger: [...new Set(dbOtherComments.map(dbComment => dbComment.UserId))].length
						});
					}
				} else {
					//Notifying someone who hasn't got a usernotification for this thread yet
					//Eg. the person who commented first, OR someone who joined a random comment thread
		
					userNotificationsToCreate.push({
						UserId: notifyUserId,
						NotificationId: dbNotification.NotificationId,
						ValueString: dbNewCommenterUser.Username,
						ValueInteger: [...new Set(dbOtherComments.map(dbComment => dbComment.UserId))].length
					});
				}
			});
		
			await this.models.UserNotification.bulkCreate(userNotificationsToCreate, {
				updateOnDuplicate: ['ValueString', 'ValueInteger', 'RenewedAt', 'UpdatedAt']
			});
		}
	}
	async _CreateOrUpdateStackingNotification() {
		// This is an updatable user notification as further comments happen. 
		// if the user HASN'T seen the notification, the valueinteger may increase (eg. "bob and 2 others" becomes "sarah and 3 others")
		// if the user has seen the notification, a new one is made. (eg. "sarah commented")
		// A SEEN NOTIFICATION SHOULD NEVER CHANGE


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
	async _CreateNotification(notifyUserIds, type, notificationProperties = {}, valueInteger = null, valueString = null) {
		//The most basic notification operation. creates a notification, makes usernotifications
		//Does not update further. No chance of overlapping or sending twice.
	
		notifyUserIds = this._CleanNotifyUserIds(notifyUserIds);
		
		let dbNotification = await this.models.Notification.create({
			Type: type,
			...notificationProperties
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