import Sequelize from 'sequelize';
import moment from 'moment';
import validator from 'validator';
import common from '../common';
import mapper from '../mapper';

import Service from './Service';

export default class GroupService extends Service {
	async GetAll() {
		let dbGroups = await this.models.Group.findAll();
		return dbGroups.map(mapper.fromDbGroup);
	}
	async GetByIds(groupIds, withInclude = false, forUserId = null) {
		let dbGroups = await this.models.Group.findAll({
			where: {
				GroupId: {
					[Sequelize.Op.in]: groupIds
				}
			},
			include: withInclude
				? this._GetFullIncludeForGroup(forUserId)
				: []
		});

		return dbGroups.map(mapper.fromDbGroup);
	}
	async GetById(groupId, withInclude = false, forUserId = null) {
		let groups = await this.GetByIds([groupId], withInclude, forUserId);

		return groups.length === 1 ? groups[0] : null;
	}
	async GetPendingGroupInfoForGroup(groupId) {
		// Removes requests DENIED by the group
		// Includes invites IGNORED by the user

		//Both come with USER associated data
		let [groupRequests, groupInvites] = await Promise.all([
			this.GetPendingGroupRequestsForGroup(groupId),
			this.GetPendingGroupInvitesForGroup(groupId)
		]);

		return {
			groupRequests,
			groupInvites
		};
	}
	async GetPendingGroupRequestsForGroup(groupId) {
		let dbGroupRequests = await this.models.GroupRequest.findAll({
			where: {
				...this._GetPendingGroupRequestWhere(),
				GroupId: groupId,
				DeniedAt: { //Group doesn't need to see requests they denied
					[Sequelize.Op.eq]: null
				}
			},
			include: [{
				model: this.models.User,
				as: 'User'
			}]
		});

		return dbGroupRequests.map(mapper.fromDbGroupRequest);
	}
	async GetPendingGroupInvitesForGroup(groupId) {
		let dbGroupInvites = await this.models.GroupInvite.findAll({
			where: {
				...this._GetPendingGroupInviteWhere(),
				GroupId: groupId
			},
			include: [{
				model: this.models.User,
				as: 'User'
			}, {
				model: this.models.User,
				as: 'InvitedByUser'
			}]
		});

		return dbGroupInvites.map(mapper.fromDbGroupInvite);
	}
	async GetPendingGroupInfoForUser(userId) {
		// Includes requests DENIED by the group
		// Removes invites IGNORED by the user

		//Both come with GROUP associated data
		let [groupRequests, groupInvites] = await Promise.all([
			this.GetPendingGroupRequestsForUser(userId),
			this.GetPendingGroupInvitesForUser(userId)
		]);
		
		return {
			groupRequests,
			groupInvites
		};		
	}
	async GetPendingGroupRequestsForUser(userId) {
		let dbGroupRequests = await this.models.GroupRequest.findAll({
			where: {
				...this._GetPendingGroupRequestWhere(),
				UserId: userId
			},
			include: [{
				model: this.models.Group,
				as: 'Group'
			}]
		});

		return dbGroupRequests.map(mapper.fromDbGroupRequest);
	}
	async GetPendingGroupInvitesForUser(userId) {
		let dbGroupInvites = await this.models.GroupInvite.findAll({
			where: {
				...this._GetPendingGroupInviteWhere(),
				UserId: userId,
				IgnoredAt: { //User doesn't need to see invites they ignored
					[Sequelize.Op.eq]: null
				}
			},
			include: [{
				model: this.models.Group,
				as: 'Group'
			}, {
				model: this.models.User,
				as: 'InvitedByUser'
			}]
		});

		return dbGroupInvites.map(mapper.fromDbGroupInvite);
	}
	async DbGetGroupUser(userId, groupId) {
		return await this.models.GroupUser.findOne({
			where: {
				UserId: userId,
				GroupId: groupId		
			}
		});
	}
	async GetGroupUsers(groupId) {
		let dbGroupUsers = await this.models.GroupUser.findAll({
			where: {
				GroupId: groupId
			},
			include: [{
				model: this.models.User,
				as: 'User'
			}]
		});

		return dbGroupUsers.map(mapper.fromDbGroupUser);
	}
	async GetGroupUsersForUserId(userId) {
		if(!userId) return []; //Sometimes invoked for anon users for code cleanliness, bail out here

		let dbGroupUsers = await this.models.GroupUser.findAll({
			where: {
				UserId: userId
			},
			include: [{
				model: this.models.Group,
				as: 'Group'
			}]
		});

		return dbGroupUsers.map(mapper.fromDbGroupUser);
	}
	async GetGroups(userId, forUserId, search, sortBy, offset, limit) {
		let groupWhere = {};

		if(forUserId) {
			//Filter by the forUser's groups
			let groupUsers = await this.GetGroupUsersForUserId(forUserId);
			let groupIds = groupUsers.map(groupUser => groupUser.groupId);

			groupWhere.GroupId = {
				[Sequelize.Op.in]: groupIds
			};
		}

		//Mutual
		if(sortBy === 4 && userId) {
			//Filter by the REQESTING user's groups
			let groupUsers = await this.models.GroupUser.findAll({
				where: {
					UserId: userId
				}
			});
			let groupIds = groupUsers.map(groupUser => groupUser.groupId);

			groupWhere.GroupId = {
				...(groupWhere.GroupId || {}),
				[Sequelize.Op.in]: groupIds
			};
		}

		let groupOrder = [];

		switch(sortBy) {
			case 2: //Newest
				break; // done by thenby
			case 3: //Alphabetical
				groupOrder.push(['Name']);
				break;
			default:
				groupOrder.push(['MemberCount', 'DESC']); 
		}
		groupOrder.push(['CreatedAt']);//thenby

		if(search) {
			let lowerSearch = search.toLowerCase();
			//Must be the last thing
			groupWhere = [
				Sequelize.where(Sequelize.fn('lower', Sequelize.col('Name')), {
					[Sequelize.Op.like]: `%${lowerSearch}%`
				}),
				groupWhere
			]
		}

		let dbGroups = await this.models.Group.findAll({
			where: groupWhere,
			order: groupOrder,
			offset: offset,
			limit: limit
		});

		return dbGroups.map(mapper.fromDbGroup)
	}
	async GetStatsForGroup(groupId) {
		let dbComics = await this.models.Comic.findAll({
			where: {
				GroupId: groupId,
				CompletedAt: {
					[Sequelize.Op.ne]: null
				}
			}
		});
		
		let comicTotalRating = dbComics.reduce((total, dbComic) => total + (dbComic.Rating > 0 ? dbComic.Rating : 0), 0);
		let comicTotalPanels = dbComics.reduce((total, dbComic) => total + (dbComic.PanelCount), 0);

		return {
			comicCount: dbComics.length,
			panelCount: comicTotalPanels,
			comicTotalRating: comicTotalRating
		};
	}
	async JoinGroup(userId, groupId) {
		let group = await this.GetById(groupId);
		if(!userId || !group) throw 'Invalid group join data supplied';

		//Check if they already have an invite from this group
		let dbExistingGroupInvite = await this.models.GroupInvite.findOne({
			where: {
				...this._GetPendingGroupInviteWhere(),
				GroupId: groupId,
				UserId: userId
				//We include invites that may have been ignored (as long as theyre in the timeframe)
			}
		});

		if(dbExistingGroupInvite) {
			//If we're requesting to join a group we have an invite for, just accept the invite
			return await this.ActionGroupInvite(userId, dbExistingGroupInvite.GroupInviteId, true);
		} else {
			if(group.isPublic) {
				//This will check if they're already a member
				let newGroupUser = await this._AddUserToGroup(userId, groupId);
	
				//TODO: Send user joined notification to group admins (only in this case)
				return newGroupUser;
			} else {
				//Check if they are already a group member, if they are, send back the groupUser (basically the same as a public group join result on client side)
				let dbExistingGroupUser = await this.DbGetGroupUser(userId, groupId);
				if(dbExistingGroupUser) return mapper.fromDbGroupUser(dbExistingGroupUser);
			
				//Check if they already have a pending request
				let dbExistingGroupRequest = await this.models.GroupRequest.findOne({
					where: {
						...this._GetPendingGroupRequestWhere(),
						GroupId: groupId,
						UserId: userId
					}
				});
				if(dbExistingGroupRequest) return common.getErrorResult('You have already requested to join this group.');
	
				let dbNewGroupRequest = await this.models.GroupRequest.create({
					GroupId: groupId,
					UserId: userId
				});
	
				//TODO: Send user request notifiation to group admins
				return mapper.fromDbGroupRequest(dbNewGroupRequest);
			}
		}
	}
	async ActionGroupRequest(actionedByUserId, groupId, groupRequestId, isApproving = false) {
		if(!actionedByUserId || !groupId || !groupRequestId) throw 'Invalid group request data supplied';

		let dbPendingGroupRequest = await this.models.GroupRequest.findOne({
			where: {
				...this._GetPendingGroupRequestWhere(),
				GroupId: groupId, //CRUCIAL - this is what we checked permissions on
				GroupRequestId: groupRequestId
				//We include requests that may have been denied (as long as theyre in the timeframe)
			},
			include: [{
				model: this.models.Group,
				as: 'Group'
			}]
		});
		if(!dbPendingGroupRequest) throw 'Invalid pending group request';

		dbPendingGroupRequest.ActionedByUserId = actionedByUserId;

		if(isApproving) {
			//Approve the request first, in case the below fails
			dbPendingGroupRequest.ApprovedAt = new Date();
			await dbPendingGroupRequest.save();

			await this.services.Notification.SendGroupRequestApprovedNotification(dbPendingGroupRequest.UserId, dbPendingGroupRequest.GroupId, dbPendingGroupRequest.Group.Name);

			return await this._AddUserToGroup(dbPendingGroupRequest.UserId, dbPendingGroupRequest.GroupId);
		} else {
			dbPendingGroupRequest.DeniedAt = new Date();
			await dbPendingGroupRequest.save();
		}
	}
	async InviteToGroupByUsername(fromUserId, username, groupId) {
		let group = await this.GetById(groupId); //Also used for notification below
		if(!fromUserId || !username || !group || group.isPublic) throw('Invalid group invite data supplied');

		//Check if user exists
		let dbUser = await this.services.User.DbGetByUsername(username);
		if(!dbUser) return common.getErrorResult(`No user with username: ${username}.`);

		//Check if they are already a group member
		let dbExistingGroupUser = await this.DbGetGroupUser(dbUser.UserId, groupId);
		if(dbExistingGroupUser) return common.getErrorResult(`${username} is already a member.`);
		
		//Check if they already have been invited
		let dbExistingGroupInvite = await this.models.GroupInvite.findOne({
			where: {
				...this._GetPendingGroupInviteWhere(),
				GroupId: groupId,
				UserId: dbUser.UserId
			}
		});
		if(dbExistingGroupInvite) return common.getErrorResult(`${username} has already been invited.`);

		//Check if they have already requested to join
		let dbExistingGroupRequest = await this.models.GroupRequest.findOne({
			where: {
				...this._GetPendingGroupRequestWhere(),
				GroupId: groupId,
				UserId: dbUser.UserId
				//We include requests that may have been denied (as long as theyre in the timeframe)
			}
		});

		if(dbExistingGroupRequest) {
			//If we're inviting someone who has already requested, just approve the request
			return await this.ActionGroupRequest(fromUserId, groupId, dbExistingGroupRequest.GroupRequestId, true);
		} else {
			//If all checks ok, send invite
			let dbNewGroupInvite = await this.models.GroupInvite.create({
				UserId: dbUser.UserId,
				GroupId: groupId,
				InvitedByUserId: fromUserId
			});

			this.services.Notification.SendGroupInviteReceivedNotification(dbUser.UserId, group.groupId, group.name);

			//Used on client
			let dbGroupInviteWithUser = await this.models.GroupInvite.findOne({
				where: {
					GroupInviteId: dbNewGroupInvite.GroupInviteId
				},
				include: [{
					model: this.models.User,
					as: 'User'
				}]
			});

			return mapper.fromDbGroupInvite(dbGroupInviteWithUser);
		}
	}
	async ActionGroupInvite(userId, groupInviteId, isAccepting = false) {
		if(!userId || !groupInviteId) throw 'Invalid group invite data supplied';

		let dbPendingGroupInvite = await this.models.GroupInvite.findOne({
			where: {
				...this._GetPendingGroupInviteWhere(),
				UserId: userId, //CRUCIAL - this is what we checked permissions on
				GroupInviteId: groupInviteId
				//We include invites that may have been ignored (as long as theyre in the timeframe)
			}
		});
		if(!dbPendingGroupInvite) throw 'Invalid pending group invite';

		if(isAccepting) {
			//Accept the invite first, in case below fails
			dbPendingGroupInvite.AcceptedAt = new Date();
			dbPendingGroupInvite.save();

			return await this._AddUserToGroup(dbPendingGroupInvite.UserId, dbPendingGroupInvite.GroupId);
			//TODO notify admins of join (only in this case)
		} else {
			dbPendingGroupInvite.IgnoredAt = new Date();
			await dbPendingGroupInvite.save();
		}
	}
	async SaveGroup(userId, group) {
		let isValidName = validator.isLength(group.name, { min: 3, max: 20 });
		let isValidDescription = !group.description || validator.isLength(group.description, { max: 8000 });

		if(!isValidName || !isValidDescription) throw 'Invalid name or description supplied.';

		let saveData = {
			Name: group.name,
			Description: group.description
		};

		if(group.groupId) {
			await this.models.Group.update({
				...saveData
			}, {
				where: {
					GroupId: group.groupId
				}
			});
			 
			return this.GetById(group.groupId);
		} else {
			let dbNewGroup = await this.models.Group.create({
				...saveData,
				CreatedByUserId: userId,
				IsPublic: group.isPublic //Setting is permanent
			});

			await this._AddUserToGroup(userId, dbNewGroup.GroupId, true);
			 
			return this.GetById(dbNewGroup.GroupId);
		}
	}
	async RemoveUserFromGroup(userId, groupId) {
		//Make sure user is part of group
		let dbGroupUser = await this.DbGetGroupUser(userId, groupId);
		if(!dbGroupUser) return; // No need to error, could have been removed at the same time as leaving
			
		await dbGroupUser.destroy();

		await this.models.Group.decrement('MemberCount', {
			where: {
				GroupId: groupId
			}
		});
	}
	async SaveGroupAvatarUrl(groupId, avatarUrl) {
		if(!groupId || !avatarUrl) throw 'Invalid group avatar data supplied';

		await this.models.Group.update({
			AvatarUrl: avatarUrl
		}, {
			where: {
				GroupId: groupId
			}
		});
	}
	async GetGroupComments(groupId) {
		let dbGroupComments = await this.models.GroupComment.findAll({
			where: {
				GroupId: groupId
			},
			include: [{
				model: this.models.User,
				as: 'User'
			}]
		});

		return dbGroupComments.map(mapper.fromDbGroupComment);
	}
	async PostGroupComment(userId, groupId, value) {
		if(!userId || !groupId || !value) throw 'Invalid group comment data supplied';

		let dbNewGroupComment = await this.models.GroupComment.create({
			UserId: userId,
			GroupId: groupId,
			Value: value
		});

		this.services.Notification.SendGroupCommentNotification(dbNewGroupComment);

		return mapper.fromDbGroupComment(dbNewGroupComment);
	}
	async UpdateGroupComment(userId, groupId, groupCommentId, value) {
		if(!userId || !groupId || !groupCommentId || !value) throw 'Invalid group comment data supplied';

		await this.models.GroupComment.update({
			Value: value
		}, {
			where: {
				UserId: userId, //Make sure it's the user's
				GroupId: groupId, //Make sure it's the group's
				GroupCommentId: groupCommentId
			}
		});
	}
	async DeleteGroupComment(userId, groupId, groupCommentId) {
		if(!userId || !groupId || !groupCommentId) throw 'Invalid group comment data supplied';

		await this.models.GroupComment.destroy({
			where: {
				UserId: userId, //Make sure it's the user's
				GroupId: groupId, //Make sure it's the group's
				GroupCommentId: groupCommentId
			}
		});
	}
	async GetGroupChallenges(groupId) {
		let dbGroupChallenges = await this.models.GroupChallenge.findAll({
			where: {
				GroupId: groupId
			}
		});

		return dbGroupChallenges.map(mapper.fromDbGroupChallenge);
	}
	async CreateGroupChallenge(userId, groupId, challenge) {
		if(!userId || !groupId || !validator.isLength(challenge, { min: 1, max: 64 })) throw 'Invalid group challenge data supplied';

		let dbNewGroupChallenge = await this.models.GroupChallenge.create({
			CreatedByUserId: userId,
			GroupId: groupId,
			Challenge: challenge
		});

		return mapper.fromDbGroupChallenge(dbNewGroupChallenge);
	}
	async RemoveGroupChallenge(groupId, groupChallengeId) {
		if(!groupId || !groupChallengeId) throw 'Invalid group challenge data supplied';

		return await this.models.GroupChallenge.destroy({
			where: {
				GroupId: groupId,
				GroupChallengeId: groupChallengeId
			}
		});
	}
	async _AddUserToGroup(userId, groupId, isGroupAdmin = false) {
		//This is never called directly, as it is always JOIN,REQUEST,INVITE initiated
		if(!userId || !groupId) throw 'Invalid group data supplied';

		//Check if user is already part of group
		let dbExistingGroupUser = await this.DbGetGroupUser(userId, groupId);
		if(dbExistingGroupUser) throw 'User is already in group';

		let dbNewGroupUser = await this.models.GroupUser.create({
			UserId: userId,
			GroupId: groupId,
			IsGroupAdmin: isGroupAdmin
		});

		await this.models.Group.increment('MemberCount', { 
			where: { 
				GroupId: groupId 
			}
		});

		//Note: notifications should not happen here, as its used by various means of adding
		return mapper.fromDbGroupUser(dbNewGroupUser);
	}
	_GetPendingGroupRequestWhere() {
		return {
			CreatedAt: {
				[Sequelize.Op.gt]: moment().subtract(common.config.GroupRequestDays, 'days').toDate()
			},
			ApprovedAt: {
				[Sequelize.Op.eq]: null
			}
			//Don't remove DeniedAt = null, we don't want to alert to denied requests
		};
	}
	_GetPendingGroupInviteWhere() {
		return {
			CreatedAt: {
				[Sequelize.Op.gt]: moment().subtract(common.config.GroupRequestDays, 'days').toDate()
			},
			AcceptedAt: {
				[Sequelize.Op.eq]: null
			}
			//Don't remove IgnoredAt = null, we don't want to alert the group that they ignored 
		}
	}
	_GetFullIncludeForGroup(forUserId) {
		let include = [{
			model: this.models.GroupUser,
			as: 'GroupUsers',
			include: [{
				model: this.models.User,
				as: 'User'
			}]
		}, {
			model: this.models.GroupComment,
			as: 'GroupComments',
			include: [{
				model: this.models.User,
				as: 'User'
			}]
		}, {
			model: this.models.GroupChallenge,
			as: 'GroupChallenges'
		}];

		if(forUserId) {
			//If forUserId supplied, include a pending request they might have to join
			include.push({
				model: this.models.GroupRequest,
				as: 'GroupRequests',
				required: false,
				where: {
					...this._GetPendingGroupRequestWhere(),
					UserId: forUserId
				}
			})
		}

		return include;
	}
}