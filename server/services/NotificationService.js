import Sequelize from 'sequelize';
import moment from 'moment';
import common from '../common';
import mapper from '../mapper';

import Service from './Service';

export default class NotificationService extends Service {
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
	async GetNotificationsForUserId(userId, lastCheckedAt) {
		let userNotificationWhere = {
			UserId: userId,
			ExpiredAt: {
				[Sequelize.Op.or]: {
					[Sequelize.Op.gte]: new Date(),
					[Sequelize.Op.eq]: null
				}
			}
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
	async SendGroupCommentNotification(dbNewGroupComment) {
		this._CreateOrUpdateCommentNotification(dbNewGroupComment, 'GroupComment', common.enums.NotificationType.GroupComment, common.enums.NotificationType.GroupCommentMention, { GroupId: dbNewGroupComment.GroupId });
	}
	async SendGroupRequestApprovedNotification(userId, groupId, groupName) {
		//Takes the user to the group page that accepted them
		await this._CreateNotification([userId], common.enums.NotificationType.GroupRequestApproved, { GroupId: groupId }, null, groupName);
	}
	async SendGroupInviteReceivedNotification(userId, groupId, groupName) {
		//Takes the user to their pending requests (do not want groupId)
		await this._CreateNotification([userId], common.enums.NotificationType.GroupInviteReceived, {}, null, groupName);
	}
	async SendUserJoinedGroupNotification(newlyJoinedUserId, groupId) {
		let dbGroup = await this.models.Group.findOne({
			where: {
				GroupId: groupId
			},
			include: [{
				model: this.models.GroupUser,
				as: 'GroupUsers'
			}]
		});

		//Admins
		let notifyUserIds = this._CleanNotifyUserIds(
			dbGroup.GroupUsers
				.filter(dbGroupUser => !!dbGroupUser.GroupAdminAt && new Date(dbGroupUser.GroupAdminAt) <= new Date())
				.map(dbGroupUser => dbGroupUser.UserId)
		);
		if (notifyUserIds.length < 1) return; //No admins in group

		let dbNewUser = await this.models.User.findOne({
			where: {
				UserId: newlyJoinedUserId
			}
		});
		if(!dbNewUser) return; //Should not occur

		//Important to remove the newly joined user!
		let dbExistingGroupUsers = dbGroup.GroupUsers
			.filter(dbGroupUser => dbGroupUser.UserId !== newlyJoinedUserId);

		this._CreateOrUpdateDynamicNotification(notifyUserIds, common.enums.NotificationType.GroupUserJoined, { GroupId: groupId}, (notifyUserId, notificationId) => {
			//Create
			return {
				UserId: notifyUserId,
				NotificationId: notificationId,
				ValueString: dbNewUser.Username,
				ValueInteger: null
			};
		}, (notifyUserId, notificationId, dbLatestUserNotificationForUser = null) => {
			//Update
			if(dbLatestUserNotificationForUser && dbLatestUserNotificationForUser.SeenAt) {
				//HAS seen the latest notification. Make a new one, with only joins AFTER my latest notifications's SeenAt
				return {
					UserId: notifyUserId,
					NotificationId: notificationId,
					ValueString: dbNewUser.Username,
					ValueInteger: dbExistingGroupUsers
						.filter(dbGroupUser => new Date(dbLatestUserNotificationForUser.SeenAt) < new Date(dbGroupUser.CreatedAt))
						.length
				};
			} else if(dbLatestUserNotificationForUser) {
				//Hasn't seen the latest notification, update it's data with users who have joind SINCE the latest notification was created
				//due to notifications being created shortly after groupUser, we allow add a little time to the window here
				let notificationCreatedAt = moment(dbLatestUserNotificationForUser.CreatedAt).subtract(20, 'seconds').toDate();

				return {
					//Including THIS makes it an update
					UserNotificationId: dbLatestUserNotificationForUser.UserNotificationId,
					
					RenewedAt: new Date(),
					ValueString: dbNewUser.Username,
					ValueInteger: dbExistingGroupUsers
						.filter(dbGroupUser => notificationCreatedAt < new Date(dbGroupUser.CreatedAt))
						.length
				};
			} else {
				//Notifying someone who hasn't got a usernotification for this group yet Eg. a new admin
				//I only care about joins that have happened SINCE I became admin of group
				let notifyingDbGroupUser = dbGroup.GroupUsers.find(dbGroupUser => dbGroupUser.UserId === notifyUserId);

				return {
					UserId: notifyUserId,
					NotificationId: notificationId,
					ValueString: dbNewUser.Username,
					ValueInteger: dbExistingGroupUsers
						.filter(dbGroupUser => new Date(dbGroupUser.CreatedAt) > new Date(notifyingDbGroupUser.GroupAdminAt))
						.length
				};
			}
		})
	}
	async SendGroupRequestsReceivedNotification(groupId) {
		//This will renew any existing group requests notifications, and make them unseen
		//Basically: If a group gets a request, they will get a generic notification.
		//That generic notfication will be renewed with every successive request.
		//After a week since the latest request, the notification will expire.
		let dbGroup = await this.models.Group.findOne({
			where: {
				GroupId: groupId
			},
			include: [{
				model: this.models.GroupUser,
				as: 'GroupUsers',
				required: false,
				where: {
					GroupAdminAt: {
						[Sequelize.Op.ne]: null,
						[Sequelize.Op.lte]: new Date()
					}
				}
			}]
		});

		//Admins (filtered in db query)
		let notifyUserIds = this._CleanNotifyUserIds(
			dbGroup.GroupUsers.map(dbGroupUser => dbGroupUser.UserId)
		);
		if (notifyUserIds.length < 1) return; //No admins in group

		//The only purpose of this notification updating is to further extend the expiredAt
		let expiredAt = moment().add(common.config.GroupRequestDays, 'days').toDate();
		
		this._CreateOrUpdateDynamicNotification(notifyUserIds, common.enums.NotificationType.GroupRequestsReceived, { GroupId: groupId }, (notifyUserId, notificationId) => {
			//Create
			return {
				UserId: notifyUserId,
				NotificationId: notificationId,
				ExpiredAt: expiredAt
			};
		}, (notifyUserId, notificationId, dbLatestUserNotificationForUser = null) => {
			//Update

			//Extend the expiry
			let createOrUpdateConfig = {
				UserId: notifyUserId,
				NotificationId: notificationId,
				ExpiredAt: expiredAt
			};

			if(dbLatestUserNotificationForUser) {
				//Makes it an update
				createOrUpdateConfig.UserNotificationId = dbLatestUserNotificationForUser.UserNotificationId;
				
				createOrUpdateConfig.SeenAt = null; //Make it unseen once more
				createOrUpdateConfig.ActionedAt = null; //Make it unactioned once more
				createOrUpdateConfig.RenewedAt = new Date();
			}

			return createOrUpdateConfig;
		});
	}
	async ExpireGroupRequestsNotifications(groupId) {
		//If no more pending requests, expire the group request notifications
		let dbNotification = await this.models.Notification.findOne({
			where: {
				GroupId: groupId,
				Type: common.enums.NotificationType.GroupRequestsReceived
			}
		});

		let pendingGroupRequests = await this.services.Group.GetPendingGroupRequestsForGroup(groupId);
		
		if(pendingGroupRequests.length === 0) {
			await this.models.UserNotification.update({
				ExpiredAt: new Date() // Expire now
			}, {
				where: {
					NotificationId: dbNotification.NotificationId
				}
			});
		} else {
			//If we do have pending requests, update the expiry of the usernotifications to the most recent request + expiry days
			let latestGroupRequestCreatedAt = pendingGroupRequests
				.sort((c1, c2) => new Date(c2.createdAt) - new Date(c1.createdAt))[0].createdAt;

			let latestGroupRequestExpiredAt = moment(latestGroupRequestCreatedAt).add(common.config.GroupRequestDays, 'days').toDate();
			
			await this.models.UserNotification.update({
				ExpiredAt: latestGroupRequestExpiredAt
			}, {
				where: {
					NotificationId: dbNotification.NotificationId
				}
			});
		}
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
	async _CreateOrUpdateCommentNotification(dbNewComment, commentTableName, notificationType, mentionType, notificationProperties = {}){
		//This function will find any mentions within the comment (takes advantage of comment table mutual fiels)
		//and determine who needs to be notified based on the commentTable. eg. ComicComment = use panel creators, GroupComment = group members
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
		let userIdsConcernedWithThread = []; //UserIds who CARE about this comment thread (including non-commenters)
		let dbExistingCommentsInThread = null; //SHOULD NOT INCLUDE NEW COMMENT - Comments of the same dbTable type specified in params, that are in the same thread as the new comment

		switch(commentTableName) {
			case 'ComicComment':
				//Extract comicId from dbNewComment, which SHOULD be a ComicComment
				let [dbComicComments, dbComicPanels] = await Promise.all([
					this.models.ComicComment.findAll({
						where: { ComicId: dbNewComment.ComicId }
					}),
					this.models.ComicPanel.findAll({
						where: { ComicId: dbNewComment.ComicId }
					})
				]);
				
				//The userIds to send notifications to: all commenters and panel authors
				userIdsConcernedWithThread = [
					...dbComicComments.map(dbComicComment => dbComicComment.UserId), 
					...dbComicPanels.map(dbComicPanel => dbComicPanel.UserId)
				];

				//Important to remove the dbNewComment!
				dbExistingCommentsInThread = dbComicComments
					.filter(dbComicComment => dbComicComment.ComicCommentId !== dbNewComment.ComicCommentId);

				break;

			case 'GroupComment':
				let [dbGroupComments, dbGroupUsers] = await Promise.all([
					this.models.GroupComment.findAll({
						where: { GroupId: dbNewComment.GroupId }
					}),
					this.models.GroupUser.findAll({
						where: { GroupId: dbNewComment.GroupId }
					})
				]);

				userIdsConcernedWithThread = dbGroupUsers.map(dbGroupUser => dbGroupUser.UserId);

				//Important to remove the dbNewComment!
				dbExistingCommentsInThread = dbGroupComments
					.filter(dbGroupComment => dbGroupComment.GroupCommentId !== dbNewComment.GroupCommentId);
			
				break;
				
			default:
				console.log('Missing comment table case');
				return;
		}

		let notifyUserIds = this._CleanNotifyUserIds(
			userIdsConcernedWithThread
				.filter(userId => !userMentionUserIds.includes(userId)) //DO NOT include users MENTIONED in this comment, they already got a direct notification
				.filter(userId => userId !== dbNewComment.UserId) //DO NOT include THIS commenter
		);
		
		this._CreateOrUpdateDynamicNotification(notifyUserIds, notificationType, notificationProperties, (notifyUserId, notificationId) => {
			//Create
			return {
				UserId: notifyUserId,
				NotificationId: notificationId,
				ValueString: dbNewCommenterUser.Username,
				ValueInteger: null
			};
		}, (notifyUserId, notificationId, dbLatestUserNotificationForUser = null) => {
			//Update

			//This may be filled with a date to limit how many "and 2 others" shows up
			let otherCommentsCutoffDate = null;
					
			//Get all MY comments, if any
			let dbCommentsForUser = dbExistingCommentsInThread
				.filter(dbComment => dbComment.UserId === notifyUserId)
				.sort((c1, c2) => new Date(c2.CreatedAt) - new Date(c1.CreatedAt));
			//If I made any comments previously, make sure my notification only counts the ones AFTER my latest comment
			if(dbCommentsForUser && dbCommentsForUser.length > 0) otherCommentsCutoffDate = dbCommentsForUser[0].CreatedAt;

			//Get all comments but my own and the recent commenter. Might be 0.
			let dbOtherNewComments = dbExistingCommentsInThread
				.filter(dbComment => dbComment.UserId !== notifyUserId && dbComment.UserId !== dbNewCommenterUser.UserId)
				.filter(dbComment => {
					return otherCommentsCutoffDate 
						? new Date(dbComment.CreatedAt) > new Date(otherCommentsCutoffDate) //if we have a cuttoff date, i only care about comments after it
						: true; //otherwise i care about all!
				});

			if(dbLatestUserNotificationForUser && dbLatestUserNotificationForUser.SeenAt) {
				//HAS seen the latest notification. Make a new one, with only commenters AFTER my latest notifications's SeenAt
				return {
					UserId: notifyUserId,
					NotificationId: notificationId,
					ValueString: dbNewCommenterUser.Username,
					ValueInteger: [...new Set(dbOtherNewComments
							.filter(dbComment => new Date(new Date(dbLatestUserNotificationForUser.SeenAt) < dbComment.CreatedAt))
							.map(dbComment => dbComment.UserId) //We only care about UNIQUE commenters
						)].length
				};
			} else if(dbLatestUserNotificationForUser) {
				//Hasn't seen the latest notification, update it's data
				return {
					//Including THIS makes it an update
					UserNotificationId: dbLatestUserNotificationForUser.UserNotificationId,
					
					RenewedAt: new Date(),
					ValueString: dbNewCommenterUser.Username,
					ValueInteger: [...new Set(dbOtherNewComments
						.map(dbComment => dbComment.UserId) //We only care about UNIQUE commenters
					)].length
				};
			} else {
				//Notifying someone who hasn't got a usernotification for this thread yet
				//Eg. the person who commented first, OR someone who joined a random comment thread
				return {
					UserId: notifyUserId,
					NotificationId: notificationId,
					ValueString: dbNewCommenterUser.Username,
					ValueInteger: [...new Set(dbOtherNewComments
						.map(dbComment => dbComment.UserId) //We only care about UNIQUE commenters
					)].length
				};
			}
		});
	}
	async _CreateOrUpdateDynamicNotification(notifyUserIds, notificationType, notificationProperties, createUserNotificationMap, updateUserNotificationMap) {
		// This is an updatable user notification as further events happen. 
		// if the user HASN'T seen the notification, the valueinteger may increase (eg. "bob and 2 others" becomes "sarah and 3 others")
		// if the user has seen the notification, a new one is made. (eg. "sarah commented")
		// A SEEN NOTIFICATION WILL NEVER CHANGE

		// Find or create a notification with the parsed in type
		let [dbNotification, dbNotificationWasCreated] = await this.models.Notification.findOrCreate({
			where: {
				Type: notificationType,
				...notificationProperties
			}
		});

		if(dbNotificationWasCreated) {
			//We just made the root stacking notification, so simply make the first round of user ones now
			this.models.UserNotification.bulkCreate(notifyUserIds.map(notifyUserId => {
				return createUserNotificationMap(notifyUserId, dbNotification.NotificationId);
			}));
		} else {
			//Get the existing usernotifications for this notification
			let dbExistingUserNotifications = await this.models.UserNotification.findAll({
				where: {
					NotificationId: dbNotification.NotificationId
				}
			});
	
			//Some of these may be updates (using PK)
			let userNotificationsToCreate = notifyUserIds.map(notifyUserId => {
				//Get all usernotifications i've already gotten for this notification
				let dbUserNotificationsForUser = dbExistingUserNotifications
					.filter(dbUserNotification => dbUserNotification.UserId === notifyUserId)
					.sort((n1, n2) => new Date(n2.CreatedAt) - new Date(n1.CreatedAt));

				//Get the latest, if it exists
				let dbLatestUserNotificationForUser = dbUserNotificationsForUser.length > 0
					? dbUserNotificationsForUser[0]
					: null;

				//Pass it into the update map with the userId
				return updateUserNotificationMap(notifyUserId, dbNotification.NotificationId, dbLatestUserNotificationForUser);
			});
		
			await this.models.UserNotification.bulkCreate(userNotificationsToCreate, {
				updateOnDuplicate: ['ValueString', 'ValueInteger', 'RenewedAt', 'UpdatedAt', 'ExpiredAt', 'SeenAt', 'ActionedAt']
			});
		}
	}
	async _CreateSingletonNotification(notifyUserIds, notificationType, valueInteger = null, valueString = null) {
		//Only ONE type of each of these in the db, with no foreign keys. Uses findorcreate.
		//Use this for notifications that don't change content from user to user (apart from valueinteger/valuestring)
	
		notifyUserIds = this._CleanNotifyUserIds(notifyUserIds);

		let [dbNotification] = await this.models.Notification.findOrCreate({
			where: {
				Type: notificationType
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
	async _CreateNotification(notifyUserIds, notificationType, notificationProperties = {}, valueInteger = null, valueString = null) {
		//The most basic notification operation. creates a notification, makes usernotifications
		//Does not update further. No chance of overlapping or sending twice.
	
		notifyUserIds = this._CleanNotifyUserIds(notifyUserIds);
		
		let dbNotification = await this.models.Notification.create({
			Type: notificationType,
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