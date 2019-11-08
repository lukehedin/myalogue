import Sequelize from 'sequelize';
import moment from 'moment';

import common from '../common';
import mapper from '../mapper';

import Service from './Service';

export default class ComicService extends Service {
	async DbGetById(comicId, forUserId = null) {
		return await this.models.Comic.findOne({
			where: {
				ComicId: comicId
			},
			include: this._GetFullIncludeForComic(forUserId)
		});
	}
	async GetById(comicId, forUserId = null) {
		let dbComic = await this.DbGetById(comicId, forUserId);
		return dbComic ? mapper.fromDbComic(dbComic) : null;
	}
	async GetTopComic(forUserId) {
		let dbComics = await this.models.Comic.findAll({
			where: {
				CompletedAt: {
					[Sequelize.Op.ne]: null
				}
			},
			include: this._GetFullIncludeForComic(forUserId),
			order: [[ 'Rating', 'DESC' ]],
			limit: 1
		});

		return dbComics.length > 0 ? mapper.fromDbComic(dbComics[0]) : null;
	}
	async GetTopComics() {
		
		let dbComics = await this.models.Comic.findAll({
			where: {
				CompletedAt: {
					[Sequelize.Op.ne]: null
				}
			},
			// a newer comic tie will beat an older comic (it got more ratings in shorter time)
			order: [[ 'CompletedAt', 'DESC' ]]
		});

		//Find the top comics
		let topComics = {};
		dbComics.forEach(dbComic => {
			let currentTop = topComics[dbComic.TemplateId];
			if(!currentTop || (currentTop && currentTop.Rating <= dbComic.Rating)) {
				topComics[dbComic.TemplateId] = dbComic;
			}
		});
		let topComicIds = Object.keys(topComics).map(key => topComics[key].ComicId);

		//Get these ones WITH includes
		let dbTopComics = await this.models.Comic.findAll({
			where: {
				ComicId: {
					[Sequelize.Op.in]: topComicIds
				}
			},
			include: this._GetFullIncludeForComic()
		});

		return dbTopComics.map(mapper.fromDbComic);
	}
	async GetComics(forUserId = null, templateId = null, authorUserId = null, ignoreComicIds = [], completedAtBefore = new Date(), includeAnonymous = false, sortBy = 1, offset = 0, limit = 5) {
		let comicWhere = {
			CompletedAt: { //Code below (sortBy === 4) relies on this being present
				[Sequelize.Op.ne]: null,
				[Sequelize.Op.lte]: completedAtBefore
			},
			ComicId: { //Code below (comicWhere.ComicId = ) relies on this being present
				[Sequelize.Op.notIn]: ignoreComicIds
			}
		};

		if(templateId) comicWhere.TemplateId = templateId;
		if(!includeAnonymous) comicWhere.IsAnonymous = false;
		
		//Top of day/week/month
		if(sortBy === 4) comicWhere.CompletedAt[Sequelize.Op.gte] = moment().subtract(1, 'days').toDate();
		if(sortBy === 5) comicWhere.CompletedAt[Sequelize.Op.gte] = moment().subtract(1, 'weeks').toDate();
		if(sortBy === 6) comicWhere.CompletedAt[Sequelize.Op.gte] = moment().subtract(1, 'month').toDate();

		//Hot (hour buffer)
		if(sortBy) comicWhere.CompletedAt[Sequelize.Op.lte] = moment().subtract(1, 'hour').toDate();

		let comicOrder = [];

		switch(sortBy) {
			case 3: //random
				comicOrder.push(Sequelize.fn('RANDOM'));
				break;
			case 7: 
				comicOrder.push(['HotRank', 'DESC']);
				break;
			case 2: //newest
				//Thenby will do this for us
				break;
			case 1: //top all
			case 4: //top today
			case 5: //top week
			case 6: //top month
			default:
				comicOrder.push([ 'Rating', 'DESC' ]);
				break;
		};
		comicOrder.push([ 'CompletedAt', 'DESC' ]);//Thenby

		if(authorUserId) {
			let dbAuthorComicPanels = await this.GetComicPanelsForUserNotCensored(authorUserId);

			let comicIds = dbAuthorComicPanels.map(dbComicPanel => dbComicPanel.ComicId);
					
			comicWhere.ComicId = {
				...comicWhere.ComicId,
				[Sequelize.Op.in]: comicIds
			};
		}
		
		let dbComics = await this.models.Comic.findAll({
			where: comicWhere,
			order: comicOrder,
			offset: offset,
			limit: limit,
			include: this._GetFullIncludeForComic(forUserId)
		});
		
		return dbComics.map(dbComic => mapper.fromDbComic(dbComic));
	}
	async GetComicsInProgress(userId) {
		let comicWhere =  {
			CompletedAt: {
				[Sequelize.Op.eq]: null
			}
		};

		if(userId) {
			comicWhere.LastAuthorUserId = {
				[Sequelize.Op.ne]: null
			};
		} else {
			comicWhere[Sequelize.Op.or] = [{
				LastAuthorAnonId: {
					[Sequelize.Op.ne]: null
				}
			}, {
				LastAuthorUserId: {
					[Sequelize.Op.ne]: null
				}
			}];
		}

		let dbComics = await this.models.Comic.findAll({
			where: comicWhere,
			include: userId ? [{
				model: this.models.ComicPanel,
				as: 'ComicPanels',
				required: false,
				where: {
					UserId: userId
				}
			}] : []
		});

		return {
			comicsInProgressCount: dbComics.length,
			myComicsInProgressCount: dbComics.filter(dbComic => dbComic.ComicPanels && dbComic.ComicPanels.length > 0).length,
			anonComicsInProgressCount: dbComics.filter(dbComic => dbComic.IsAnonymous).length
		};
	}
	async GetStatsForUser(userId) {
		//Calculate their panel points TODO make a worker service and set points on user row
		//That way we can have leaderboards etc
		let dbComicPanels = await this.GetComicPanelsForUserNotCensored(userId);

		let comicIds = dbComicPanels.map(dbComicPanel => dbComicPanel.ComicId);

		let dbComics = await this.models.Comic.findAll({
			where: {
				ComicId: {
					[Sequelize.Op.in]: comicIds
				},
				CompletedAt: {
					[Sequelize.Op.ne]: null
				}
			},
			order: [[ 'Rating', 'DESC' ], ['CompletedAt', 'DESC']]
		});
		
		let completedComicIds = dbComics.map(dbComic => dbComic.ComicId);
		let comicTotalRating = dbComics.reduce((total, dbComic) => total + (dbComic.Rating > 0 ? dbComic.Rating : 0), 0);
		let comicAverageRating = comicTotalRating / dbComics.length;
		let topComic = dbComics.length > 0 ? dbComics[0] : null; //Already sorted
		
		return {
			panelCount: dbComicPanels.filter(dbComicPanel => completedComicIds.includes(dbComicPanel.ComicId)).length,
			comicCount: dbComics.length,
			comicTotalRating: comicTotalRating,
			comicAverageRating: comicAverageRating,

			topComic: mapper.fromDbComic(topComic)
		};
	}
	async VoteComic(userId, comicId, value) {
		let dbComic = await this.models.Comic.findOne({
			where: {
				ComicId: comicId
			},
			include: [{
				//Include the user's current vote on the comic
				model: this.models.ComicVote,
				as: 'ComicVotes',
				required: false,
				where: {
					UserId: userId
				}
			}]
		});

		if(!dbComic) throw 'Invalid comic ID supplied.';

		let comicRatingAdjustment = 0;

		let existingDbComicVote = dbComic.ComicVotes && dbComic.ComicVotes[0]
			? dbComic.ComicVotes[0]
			: null;

		let votePromises = [];

		if(existingDbComicVote) {
			//No need to do anything if the value is the same for some reason
			if(existingDbComicVote.Value !== value) {
				//Incoming value subtract the existing value (maths!)
				comicRatingAdjustment = value - existingDbComicVote.Value;

				votePromises.push(
					this.models.ComicVote.update({
						Value: value
					}, {
						where: {
							ComicVoteId: existingDbComicVote.ComicVoteId
						}
					})
				);
			}
		} else {
			comicRatingAdjustment = value;

			votePromises.push(
				this.models.ComicVote.create({
					UserId: userId,
					ComicId: comicId,
					Value: value
				})
			);
		}

		if(comicRatingAdjustment !== 0) {
			dbComic.Rating = (dbComic.Rating || 0) + comicRatingAdjustment;
			votePromises.push(dbComic.save());
		}

		return await Promise.all(votePromises);
	}
	async GetComicPanelsForUserNotCensored(userId) {
		return await this.models.ComicPanel.findAll({
			where: {
				UserId: userId,
				CensoredAt: {
					[Sequelize.Op.eq]: null
				}
			}
		});
	}
	async ReportComicPanel(userId, isAdmin, comicId, comicPanelId) {
		let dbComic = await this.models.Comic.findOne({
			where: {
				ComicId: comicId,
				CompletedAt: {
					[Sequelize.Op.ne]: null
				}
			},
			include: [{
				model: this.models.ComicPanel,
				as: 'ComicPanels'
			}]
		});

		if(!dbComic) throw 'Invalid comic to report panel for';

		let dbComicPanel = dbComic.ComicPanels.find(dbComicPanel => dbComicPanel.ComicPanelId === comicPanelId);

		if(!dbComicPanel) throw 'Invalid comic panel to report';
		if (dbComicPanel.CensoredAt) return; //Panel already censored UI must not have updated yet, bail out.

		//Record a panelreport. if this is created (not found) we need to increase reportcount
		let [dbComicPanelReport, wasCreated] = await this.models.ComicPanelReport.findOrCreate({
			where: {
				UserId: userId,
				ComicPanelId: dbComicPanel.ComicPanelId
			}
		});

		if(wasCreated) {
			//If this was my first report of this comic panel, increase reportcount
			let newReportCount = dbComicPanel.ReportCount + 1;

			//Anonymous panels need half the reports to be censored, as there is no follow up punishment
			let reportLimit = (dbComicPanel.UserId 
				? common.config.ComicPanelReportLimit 
				: (common.config.ComicPanelReportLimit / 2));
			
			if(isAdmin || (newReportCount > reportLimit)) {
				//No need to update report count, the CensoredAt state indicates the total count is limit + 1;
				//Censor the panel
				dbComicPanel.CensoredAt = new Date();
				await dbComicPanel.save();

				//We can't do anything for anon users beyond this point
				if(!dbComicPanel.UserId) return;

				this.services.Notification.SendPanelCensoredNotification(dbComicPanel);

				//Find all censored panels for this user in the x days window
				let dbComicPanelsCensored = await this.models.ComicPanel.findAll({
					where: {
						UserId: dbComicPanel.UserId,
						CensoredAt: {
							[Sequelize.Op.ne]: null,
							[Sequelize.Op.gte]: moment().subtract(common.config.ComicPanelCensorForUserWindowDays, 'days').toDate()
						}
					}
				});

				//If the user has has > x panels censored in the report window
				if(dbComicPanelsCensored.length > common.config.ComicPanelCensorForUserLimit) {
					//Ban the user (temp or permanent depending on prev bans)
					this.services.User.Ban(dbComicPanel.UserId);
				}
			} else {
				//Report count went up, but no further action
				dbComicPanel.ReportCount = newReportCount;
				dbComicPanel.save();
			}

			return;
		}
	}
	async PostComicComment (userId, comicId, value) {
		if(!userId || !comicId || !value) throw 'Invalid comic comment data supplied';

		let dbComic = await this.models.Comic.findOne({
			where: {
				ComicId: comicId,
				CompletedAt: {
					[Sequelize.Op.ne]: null
				}
			},
			//This include is here for the notification audiences (panel creators and commenters)
			include: [{
				model: this.models.ComicPanel, 
				as: 'ComicPanels'
			}, {
				model: this.models.ComicComment,
				as: 'ComicComments'
			}]
		});

		if(!dbComic) throw 'Invalid comic to comment on';

		let dbCreatedComicComment = await this.models.ComicComment.create({
			UserId: userId,
			ComicId: comicId,
			Value: value
		});
		
		this.services.Notification.SendComicCommentNotification(dbCreatedComicComment, dbComic);

		return mapper.fromDbComicComment(dbCreatedComicComment);
	}
	async UpdateComicComment (userId, comicCommentId, value) {
		if(!userId || !comicCommentId || !value) throw 'Invalid comic comment data supplied';

		this.models.ComicComment.update({
			Value: value
		}, {
			where: {
				UserId: userId, //Validation
				ComicCommentId: comicCommentId
			}
		});
	}
	async DeleteComicComment (userId, comicCommentId) {
		if(!userId || !comicCommentId) throw 'Invalid comic comment data supplied';

		this.models.ComicComment.destroy({
			where: {
				UserId: userId, //Validation
				ComicCommentId: comicCommentId
			}
		});
	}
	async GetAllTemplatesWhereUnlockedWithPanels(additionalWhere = {}) {
		let dbTemplates = await this.models.Template.findAll({
			where: {
				...additionalWhere,
				UnlockedAt: {
					[Sequelize.Op.ne]: null,
					[Sequelize.Op.lte]: new Date()
				}
			},
			paranoid: false,
			include: [{
				model: this.models.TemplatePanel,
				as: 'TemplatePanels',
				paranoid: false
			}],
			order: [[ 'TemplateId', 'ASC' ]]
		});

		return dbTemplates.map(mapper.fromDbTemplate);
	}
	async GetNewTemplates(existingTemplateIds) {
		return await this.GetAllTemplatesWhereUnlockedWithPanels({
			TemplateId: {
				[Sequelize.Op.notIn]: existingTemplateIds
			}
		});
	}
	_GetFullIncludeForComic(forUserId) {
		let include = [{
			model: this.models.ComicPanel,
			as: 'ComicPanels',
			include: [{
				model: this.models.User,
				as: 'User'
			}]
		}, {
			model: this.models.ComicComment,
			as: 'ComicComments',
			include: [{
				model: this.models.User,
				as: 'User'
			}]
		}];
		
		if(forUserId) {
			//Include the user's current vote on the comic
			include.push({
				model: this.models.ComicVote,
				as: 'ComicVotes',
				required: false,
				where: {
					UserId: forUserId
				}
			});
		}
	
		return include;
	} 
}