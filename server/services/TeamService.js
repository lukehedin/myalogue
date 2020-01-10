import Sequelize from 'sequelize';
import moment from 'moment';
import validator from 'validator';
import common from '../common';
import mapper from '../mapper';

import Service from './Service';

export default class TeamService extends Service {
	async GetAll() {
		let dbTeams = await this.models.Team.findAll({
			include: [{
				model: this.models.TeamUser,
				as: 'TeamUsers',
				include: [{
					model: this.models.User,
					as: 'User'
				}]
			}]
		});

		return dbTeams.map(mapper.fromDbTeam);
	}
	async GetById(teamId) {
		let dbTeam = await this.models.Team.findOne({
			where: {
				TeamId: teamId
			},
			include: [{
				model: this.models.TeamUser,
				as: 'TeamUsers',
				include: [{
					model: this.models.User,
					as: 'User'
				}]
			}]
		});

		return dbTeam ? mapper.fromDbTeam(dbTeam) : null;
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