import Sequelize from 'sequelize';
import moment from 'moment';

import common from '../common';
import mapper from '../mapper';

import Service from './Service';

export default class TemplateService extends Service {
	async GetAll(additionalWhere = {}, excludePanels = false) {
		//Will only return unlocked templates, should never need locked ones
		let dbTemplates = await this.models.Template.findAll({
			where: {
				...additionalWhere,
				UnlockedAt: {
					[Sequelize.Op.ne]: null,
					[Sequelize.Op.lte]: new Date()
				}
			},
			paranoid: false,
			include: excludePanels ? [] : [{
				model: this.models.TemplatePanel,
				as: 'TemplatePanels',
				paranoid: false
			}],
			order: [[ 'TemplateId', 'ASC' ]]
		});

		return dbTemplates.map(mapper.fromDbTemplate);
	}
	async GetNew(existingTemplateIds) {
		return await this.GetAll({
			TemplateId: {
				[Sequelize.Op.notIn]: existingTemplateIds
			}
		});
	}
}