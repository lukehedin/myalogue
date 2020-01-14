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
	async GetGroupsInfoForUser(userId) {
		//Includes invites/requests
		let [groups, dbGroupRequests, dbGroupInvites] = await Promise.all([
			this.GetGroups(userId),
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
			groups,
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
	async GetGroups(userId) {
		let groupUsers = await this.GetGroupUsersForUserId(userId);
		let groupIds = groupUsers.map(groupUser => groupUser.groupId);

		return await this.GetByIds(groupIds);
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
			Description: group.description,
			Instruction: group.instruction
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

			await this.models.GroupUser.create({
				UserId: userId,
				GroupId: dbNewGroup.GroupId
			});
			 
			return this.GetById(dbNewGroup.GroupId);
		}
	}
}