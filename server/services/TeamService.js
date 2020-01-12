import Sequelize from 'sequelize';
import moment from 'moment';
import validator from 'validator';
import common from '../common';
import mapper from '../mapper';

import Service from './Service';

export default class TeamService extends Service {
	async GetAll(forUserId = null) {
		let teamWhere = [{
			model: this.models.TeamUser,
			as: 'TeamUsers',
			include: [{
				model: this.models.User,
				as: 'User'
			}]
		}];

		if(forUserId) {
			//Also bring back a request this user has made to join
			teamWhere.push({
				model: this.models.TeamUserRequest,
				as: 'TeamUserRequests',
				where: {
					UserId: forUserId,
					CreatedAt: {
						[Sequelize.Op.gt]: moment().subtract(common.config.TeamUserRequestDays, 'days').toDate()
					},
					ApprovedAt: {
						[Sequelize.Op.eq]: null
					}
				}
			});
		}

		let dbTeams = await this.models.Team.findAll({
			include: teamWhere
		});

		return dbTeams.map(mapper.fromDbTeam);
	}
	async GetByIds(teamIds) {
		let dbTeams = await this.models.Team.findAll({
			where: {
				TeamId: {
					[Sequelize.Op.in]: teamIds
				}
			},
			include: [{
				model: this.models.TeamUser,
				as: 'TeamUsers'
			}]
		});

		return dbTeams.map(mapper.fromDbTeam);
	}
	async GetById(teamId) {
		let dbTeams = this.GetByIds([teamId]);
		return dbTeams.length === 1 ? mapper.fromDbTeam(dbTeams[0]) : null;
	}
	async GetForUserId(userId) {
		if(!userId) return [];

		let dbTeamUsers = await this.models.TeamUser.findAll({
			where: {
				UserId: userId
			}
		});

		if(dbTeamUsers.length < 1) return []; 

		let teamIds = dbTeamUsers.map(dbTeamUser => dbTeamUser.TeamId);

		return await this.GetByIds(teamIds);
	}
	async SendInvite(fromTeamUserId, toUserId, teamId) {

	}
	async RequestToJoin(userId, teamId) {

	}
	async AcceptRequestToJoin(teamUserRequestId) {

	}
	async DenyRequestToJoin(teamUserRequestId) {

	}
	async SaveTeam(userId, team) {
		let isValidName = validator.isLength(team.name, { min: 3, max: 20 });
		let isValidDescription = !team.description || validator.isLength(team.description, { max: 8000 });

		if(!isValidName || !isValidDescription) throw 'Invalid name or description supplied.';

		if(team.teamId) {
			await this.models.Team.update({
				Name: team.name,
				Description: team.description
			}, {
				where: {
					TeamId: team.teamId
				}
			});
			 
			return this.GetById(team.teamId);
		} else {
			let dbNewTeam = await this.models.Team.create({
				Name: team.name,
				Description: team.description,
				CreatedByUserId: userId
			});

			await this.models.TeamUser.create({
				UserId: userId,
				TeamId: dbNewTeam.TeamId
			});
			 
			return this.GetById(dbNewTeam.TeamId);
		}
	}
}