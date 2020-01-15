import Sequelize from 'sequelize';
import moment from 'moment';
import validator from 'validator';
import common from '../common';
import mapper from '../mapper';

import Service from './Service';

export default class GroupService extends Service {
	async GetAll() {
		let groupWhere = [{
			model: this.models.GroupUser,
			as: 'GroupUsers'
		}];

		let dbGroups = await this.models.Group.findAll({
			include: groupWhere
		});

		return dbGroups.map(mapper.fromDbGroup);
	}
	async GetByIds(groupIds) {
		let dbGroups = await this.models.Group.findAll({
			where: {
				GroupId: {
					[Sequelize.Op.in]: groupIds
				}
			},
			include: [{
				model: this.models.GroupUser,
				as: 'GroupUsers'
			}]
		});

		return dbGroups.map(mapper.fromDbGroup);
	}
	async GetById(groupId) {
		let groups = await this.GetByIds([groupId]);

		return groups.length === 1 ? groups[0] : null;
	}
	async getGroupRequests(userId) {
		//Includes invites/requests
		let [dbGroupRequests, dbGroupInvites] = await Promise.all([
			this.models.GroupRequest.findAll({
				where: {
					UserId: userId,
					CreatedAt: {
						[Sequelize.Op.gt]: moment().subtract(common.config.GroupUserRequestDays, 'days').toDate()
					},
					ApprovedAt: {
						[Sequelize.Op.eq]: null
					}
					//Don't remove DeniedAt = null, we don't want to alert to denied requests
				},
				include: [{
					model: this.models.Group,
					as: 'Group'
				}]
			}),
			this.models.GroupInvite.findAll({
				where: {
					UserId: userId,
					CreatedAt: {
						CreatedAt: {
							[Sequelize.Op.gt]: moment().subtract(common.config.GroupUserRequestDays, 'days').toDate()
						}
					},
					AcceptedAt: {
						[Sequelize.Op.eq]: null
					},
					DeclinedAt: {
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
			})
		]);
		
		return {
			requests: dbGroupRequests.map(mapper.fromDbGroupRequest),
			invites: dbGroupInvites.map(mapper.fromDbGroupInvite)
		};		
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
			}
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

		console.log(groupWhere);

		let dbGroups = await this.models.Group.findAll({
			where: groupWhere,
			order: groupOrder,
			offset: offset,
			limit: limit
		});

		return dbGroups.map(mapper.fromDbGroup)
	}
	async GetGroupComicCount(groupId) {
		return await this.models.Comic.count({
			where: {
				GroupId: groupId,
				CompletedAt: {
					[Sequelize.Op.ne]: null
				}
			}
		});
	}
	async SendInvite(fromGroupUserId, toUserId, groupId) {

	}
	async RequestToJoin(userId, groupId) {

	}
	async AcceptRequestToJoin(groupUserRequestId) {

	}
	async DenyRequestToJoin(groupUserRequestId) {

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
				CreatedByUserId: userId
			});

			await this.AddUserToGroup(userId, dbNewGroup.GroupId);
			 
			return this.GetById(dbNewGroup.GroupId);
		}
	}
	async AddUserToGroup(userId, groupId) {
		await this.models.GroupUser.create({
			UserId: userId,
			GroupId: groupId,
			IsGroupAdmin: true
		});

		await this.models.Group.increment('MemberCount', { 
			where: { 
				GroupId: groupId 
			}
		});
	}
	async RemoveUserFromGroup(groupUserId) {
		let dbGroupUser = await this.models.GroupUser.findOne({
			where: {
				GroupUserId: groupUserId
			}
		});

		if(dbGroupUser) {
			await this.models.Group.decrement('MemberCount', {
				where: {
					GroupId: dbGroupUser.GroupId
				}
			});

			await dbGroupUser.destroy();
		}
	}
	async SaveAvatarUrl(userId, groupId, avatarUrl) {
		await this.models.Group.update({
			AvatarUrl: avatarUrl
		}, {
			where: {
				GroupId: groupId
			}
		});
	}
}