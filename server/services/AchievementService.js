import Sequelize from 'sequelize';
import validator from 'validator';
import moment from 'moment';

import common from '../common';
import mapper from '../mapper';

import Service from './Service';

export default class AchievementService extends Service {
	async ProcessForComicCompleted(dbComic) {
		let comicId = dbComic.comicId;
		let distinctUserIds = [
			...new Set(dbComic.ComicPanels
				.filter(dbComicPanel => !!dbComicPanel.UserId)
				.map(dbComicPanel => dbComicPanel.UserId)
			)];

		if(distinctUserIds.length > 0) {
			//Mark these users as requiring worker achievement checks
			this.models.User.update({
				IsAchievementCheckRequired: true
			}, {
				where: {
					IsAchievementCheckRequired: false,
					UserId: {
						[Sequelize.Op.in]: distinctUserIds
					}
				}
			});
		};
		
		//Panel position achievements
		let firstPanelUserId = dbComic.ComicPanels[0].UserId;
		if(dbComic.ComicPanels.length >= 6 && firstPanelUserId) {
			//Sandwich
			let panelsByUser = dbComic.ComicPanels.find(dbComicPanel => dbComicPanel.UserId === firstPanelUserId);
			let lastPanelUserId = dbComic.ComicPanels[dbComic.ComicPanels.length - 1].UserId;
			if(panelsByUser.length === 2 && firstPanelUserId === lastPanelUserId) {
				this.UnlockAchievement(common.enums.AchievementType.Sandwich, [firstPanelUserId], comicId);
			}
		}

		//If anyone doesn't have firstcomic achievement, unlock it
		this.UnlockAchievement(common.enums.AchievementType.FirstComic, distinctUserIds, comicId);
		
		let dbOtherComicUsingTemplate = await this.models.Comic.findOne({
			where: {
				ComicId: {
					[Sequelize.Op.ne]: dbComic.ComicId
				},
				CompletedAt: {
					[Sequelize.Op.ne]: null
				},
				TemplateId: dbComic.TemplateId
			}
		});
		if(!dbOtherComicUsingTemplate) {
			this.UnlockAchievement(common.enums.AchievementType.FirstTemplateUsage, distinctUserIds, comicId);
		}

		//Unique authors
		if(dbComic.ComicPanels.length >= 8 && distinctUserIds.length === dbComic.ComicPanels.length) {
			this.UnlockAchievement(common.enums.AchievementType.AllUniqueAuthors, distinctUserIds, comicId)
		} else {
			distinctUserIds.forEach(distinctUserId => {
				let panelCount = dbComic.ComicPanels.filter(dbComicPanel => dbComicPanel.UserId === distinctUserId).length;
				if(panelCount >= 3) {
					this.UnlockAchievement(common.enums.AchievementType.ThreePanelsOneComic, [distinctUserId], comicId);
				} else if (panelCount >= 2) {
					this.UnlockAchievement(common.enums.AchievementType.TwoPanelsOneComic, [distinctUserId], comicId);
				}
			});

			if(distinctUserIds.length === 3) {
				this.UnlockAchievement(common.enums.AchievementType.ThreeUniqueAuthors, distinctUserIds, comicId);
			}
		}

		//Completed speed
		let createdMoment = moment(dbComic.CreatedAt);
		let completedMoment = moment(dbComic.CompletedAt);
		if(moment.duration(createdMoment.diff(completedMoment)).asHours() <= 1) {
			this.UnlockAchievement(common.enums.AchievementType.FastComic, distinctUserIds, comicId);
		}

		//Panel uniqueness
		let uniqueTemplatePanelIds = [...new Set(dbComic.ComicPanels.map(dbComicPanel => dbComicPanel.TemplatePanelId))];
		if(dbComic.ComicPanels.length >= 6 && uniqueTemplatePanelIds.length <= 2) {
			this.UnlockAchievement(common.enums.AchievementType.FewUniquePanels, distinctUserIds, comicId);
		}
		if(dbComic.ComicPanels.length >= 8 && uniqueTemplatePanelIds.length === dbComic.ComicPanels.length) {
			this.UnlockAchievement(common.enums.AchievementType.AllUniquePanels, distinctUserIds, comicId);
		}

		//Panel streaks
		let streakDbComicPanels = [];
		dbComic.ComicPanels.forEach(dbComicPanel => {
			let lastDbComicPanelInStreak = streakDbComicPanels.length > 0 
				? streakDbComicPanels[streakDbComicPanels.length - 1]
				: null;

			//If streak is maintained
			if(lastDbComicPanelInStreak && lastDbComicPanelInStreak.TemplatePanelId === dbComicPanel.TemplatePanelId) {
				//Continue the streak
				streakDbComicPanels.push(dbComicPanel);
			} else {
				//Otherwise reset the streak
				streakDbComicPanels = [dbComicPanel];
			}
			
			let streakUserIds = streakDbComicPanels.map(streakDbComicPanel => streakDbComicPanel.UserId);
			//Check if the existing streak achieves anything
			if(streakDbComicPanels.length === 4) {
				this.UnlockAchievement(common.enums.AchievementType.MajorPanelStreak, streakUserIds, comicId);
			} else if (streakDbComicPanels.length === 3) {
				this.UnlockAchievement(common.enums.AchievementType.MinorPanelStreak, streakUserIds, comicId);
			}
		});
	}
	async UnlockAchievement(achievementType, userIds, comicId) {
		console.log('Achievement unlocked:' + achievementType + ' for ' + userIds.length + ' users, on comic id ' + comicId);
		let now = new Date();

		//Get all the relevant userachievements matching this type and these userids
		let dbExistingUserAchievements = await this.models.UserAchievement.findAll({
			where: {
				Type: achievementType,
				UserId: {
					[Sequelize.Op.in]: userIds
				}
			}
		});

		let createPromises = [];
		userIds.forEach(userId => {
			let dbExistingUserAchievement = dbExistingUserAchievements.find(dbExistingUserAchievement => dbExistingUserAchievement.UserId === userId);
			if(!dbExistingUserAchievement) {
				//No row, create the achievement with unlockedAt set
				createPromises.push({
					UserId: userId,
					Type: achievementType,
					UnlockedAt: now,
					ComicId: comicId
				});
			} else if(!dbExistingUserAchievement.UnlockedAt) {
				//Row found, but not achieved yet. Use PK to update
				createPromises.push({
					UserAchievementId: dbExistingUserAchievement.UserAchievementId,
					UnlockedAt: now,
					ComicId: comicId
				});
			}
		});

		//No await
		this.models.UserAchievement.bulkCreate(createPromises, {
			updateOnDuplicate: ['UnlockedAt']
		});
	}
}