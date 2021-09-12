import Sequelize from 'sequelize';

import common from '../common';
import mapper from '../mapper';
import ITemplate from '../types/ITemplate';

import Service from './Service';

export default class TemplateService extends Service {
	async SearchTemplates(search) {
		let lowerSearch = search.toLowerCase();

		let dbTemplates = this.models.Template.findAll({
			where: Sequelize.where(Sequelize.fn('lower', Sequelize.col('Name')), {
				[Sequelize.Op.like]: `%${lowerSearch}%`
			}),
			order:  [['UpdatedAt', 'DESC']],
			limit: 10
		});

		return dbTemplates.map(mapper.fromDbTemplate);
	}
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

		return dbTemplates
			//Do not return any templates that don't have template panels, these are unplayable and break things.
			.filter(dbTemplate => dbTemplate.TemplatePanels && dbTemplate.TemplatePanels.length > 0)
			.map(mapper.fromDbTemplate);
	}
	async GetNew(existingTemplateIds) {
		return await this.GetAll({
			TemplateId: {
				[Sequelize.Op.notIn]: existingTemplateIds
			}
		});
	}
	async GetDbTemplateForPlay(userId, templateId) {
		let templateWhere = {
			UnlockedAt: {
				[Sequelize.Op.ne]: null,
				[Sequelize.Op.lte]: new Date()
			}
		};
		if(templateId) templateWhere.TemplateId = templateId;

		let dbLatestTemplates = await this.models.Template.findAll({
			//If a templateId is supplied, only 1 will be returned and the random below will select it
			where: templateWhere,
			order: [[ 'UnlockedAt', 'DESC' ]]
		});

		if(!dbLatestTemplates || dbLatestTemplates.length === 0) throw 'No templates to play with';
		
		//Anonymous users can't access the latest template right away (but if there is only 1, dont skip it!)
		let startIdx = (userId || dbLatestTemplates.length === 1 ? 0 : 1);
		return dbLatestTemplates[common.getRandomInt(startIdx, dbLatestTemplates.length - 1)];
	}
}