import Sequelize from 'sequelize';
import validator from 'validator';
import moment from 'moment';

import common from '../common';
import mapper from '../mapper';

import Service from './Service';

export default class AchievementService extends Service {
	async ProcessForComicCompleted(dbComic) {
		//User participation achievements (involve checking large amount of data other than that in dbComic)
		let participationAchievements = [
			common.enums.AchievementType.LotsOfComics,
			common.enums.AchievementType.LotsOfTemplates
		];

		let comicId = dbComic.comicId;
		let distinctUserIds = [
			...new Set(dbComic.ComicPanels
				.filter(dbComicPanel => !!dbComicPanel.UserId)
				.map(dbComicPanel => dbComicPanel.UserId)
			)];

		if(distinctUserIds.length > 0) {
			participationAchievements.forEach(participationAchievement => {
				this.SetAchievementCheckRequired(participationAchievement, distinctUserIds)
			});
		};
		
		//Panel position achievements
		let lastPanelUserId = dbComic.ComicPanels[dbComic.ComicPanels.length - 1].UserId;
		let firstPanelUserId = dbComic.ComicPanels[0].UserId;
		if(firstPanelUserId || lastPanelUserId) {
			if(firstPanelUserId) {
				this.SetAchievementCheckRequired(common.enums.AchievementType.LotsOfFirstPanels, [firstPanelUserId])
			}
			if(lastPanelUserId) {
				this.SetAchievementCheckRequired(common.enums.AchievementType.LotsOfLastPanels, [lastPanelUserId]);
			}

			//Sandwich
			if(dbComic.ComicPanels.length >= 6 && firstPanelUserId === lastPanelUserId) {
				let panelsByUser = dbComic.ComicPanels.find(dbComicPanel => dbComicPanel.UserId === firstPanelUserId);
				if(panelsByUser.length === 2) {
					this.UnlockAchievement(common.enums.AchievementType.Sandwich, [firstPanelUserId], comicId);
				}
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
		return;
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
					CheckRequiredAt: null,
					UnlockedAt: now,
					ComicId: comicId
				});
			}
		});

		//No await
		this.models.UserAchievement.bulkCreate(createPromises, {
			updateOnDuplicate: ['UnlockedAt', 'CheckRequiredAt']
		});
	}
	async SetAchievementCheckRequired(achievementType, userIds) {
		console.log('Set achievment check required:' + achievementType + ' for ' + userIds.length + ' users');
		return;
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

		//Update the existing ones to be re-checked
		//(DO NOT include rows already with checkrequiredat, but this filter must happen here or the create below will create dupes)
		let dbUserAchievementIdsToRecheck = dbExistingUserAchievements
			.filter(dbExistingUserAchievement => !dbExistingUserAchievement.CheckRequiredAt && !dbExistingUserAchievement.UnlockedAt)
			.map(dbExistingUserAchievement => dbExistingUserAchievement.UserAchievementId);

		if(dbUserAchievementIdsToRecheck.length > 0) {
			//No await
			this.models.UserAchievement.update({
				CheckRequiredAt: now
			}, {
				where: {
					UserAchievementId: {
						[Sequelize.Op.in]: dbUserAchievementIdsToRecheck
					}
				}
			});
		}

		//Create the new ones to be checked for first time
		//Find the userids that were not returnd (no row for the achievement yet)
		let existingUserIds = dbExistingUserAchievements.map(dbUserAchievement => dbUserAchievement.UserId);
		let createForUserIds = userIds.filter(userId => !existingUserIds.includes(userId));
		
		if(createForUserIds.length > 0) {
			//No await
			this.models.UserAchievement.bulkCreate(createForUserIds.map(userId => {
				return {
					CheckRequiredAt: now,
					Type: achievementType,
					UserId: userId
				};
			}))
		}
	}
}