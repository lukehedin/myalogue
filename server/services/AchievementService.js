import Sequelize from 'sequelize';
import validator from 'validator';
import moment from 'moment';

import common from '../common';
import mapper from '../mapper';

import Service from './Service';

export default class AchievementService extends Service {
	async GetAllAchievements() {
		return [{
			type: common.enums.AchievementType.FirstComic,
			name: 'Spoke4Yourself',
			description: 'Feature in a comic'
		}, {
			type: common.enums.AchievementType.FastComic,
			name: 'Fast and furious',
			description: 'Feature in a comic that was started and completed in an hour or less'
		}, {
			type: common.enums.AchievementType.TopComic,
			name: 'Comic royalty',
			description: 'Feature in a comic that reaches the top of the comic leaderboard'
		}, {
			type: common.enums.AchievementType.TopUser,
			name: 'Current reigning',
			description: 'Reach the top of the user leaderboard'
		}, {
			type: common.enums.AchievementType.LotsOfComics,
			name: 'Vast voice',
			description: 'Feature in 1500 comics',
			targetInt: 1500
		}, {
			type: common.enums.AchievementType.LotsOfTemplates,
			name: 'Versatile voice',
			description: 'Use 100 different templates',
			targetInt: 100
		}, {
			type: common.enums.AchievementType.HighTotalRating,
			name: 'Critically acclaimed',
			description: 'Reach a total comic rating of 5000',
			targetInt: 5000
		}, {
			type: common.enums.AchievementType.FirstTemplateUsage,
			name: 'First in, best dressed',
			description: 'Feature in the first comic using a particular template'
		}, {
			type: common.enums.AchievementType.TwoPanelsOneComic,
			name: 'Recurring character',
			description: 'Make two panels in a single comic'
		}, {
			type: common.enums.AchievementType.ThreePanelsOneComic,
			name: 'Breakout character',
			description: 'Make three panels in a single comic'
		}, {
			type: common.enums.AchievementType.Sandwich,
			name: 'Sandvich',
			description: 'In a comic with at least 6 panels, make only the first and last panel'
		}, {
			type: common.enums.AchievementType.AllUniqueAuthors,
			name: 'Full house',
			description: 'Feature in a comic with at least 8 panels, each by a unique user'
		}, {
			type: common.enums.AchievementType.ThreeUniqueAuthors,
			name: 'Three\'s company',
			description: 'Feature in a comic with only 3 unique users'
		}, {
			type: common.enums.AchievementType.AllUniquePanels,
			name: 'Good shuffle',
			description: 'Feature in a comic with 8 or more unique panels'
		}, {
			type: common.enums.AchievementType.MinorPanelStreak,
			name: 'Déjà vu',
			description: 'Be part of a streak of 3 identical panels'
		}, {
			type: common.enums.AchievementType.MajorPanelStreak,
			name: 'Groundhog day',
			description: 'Be part of a streak of 4 identical panels'
		}, {
			type: common.enums.AchievementType.TopFirstPanel,
			name: 'Grand opening',
			description: 'Make the first panel for a comic on top of the comic leaderboard'
		}, {
			type: common.enums.AchievementType.TopLastPanel,
			name: 'Falcon punchline',
			description: 'Make the last panel for a comic on top of the comic leaderboard'
		}, {
			type: common.enums.AchievementType.LotsOfFirstPanels,
			name: 'First and foremost',
			description: 'Make the first panel for 500 comics',
			targetInt: 500
		}, {
			type: common.enums.AchievementType.LotsOfLastPanels,
			name: 'Last but not least',
			description: 'Make the last panel for 500 comics',
			targetInt: 500
		}];
	}
	async GetByType(achievementType) {
		return this.GetAllAchievements().find(achievement => achievement.type === achievementType);
	}
	async ProcessForTopComic(dbComic) {
		let comicId = dbComic.ComicId;

		let distinctUserIds = [
			...new Set(dbComic.ComicPanels
				.filter(dbComicPanel => !!dbComicPanel.UserId)
				.map(dbComicPanel => dbComicPanel.UserId)
			)];

		//Top of leaderboard comic
		this._UnlockAchievement(common.enums.AchievementType.TopComic, distinctUserIds, comicId);

		//Panel position achievements
		let lastPanelUserId = dbComic.ComicPanels[dbComic.ComicPanels.length - 1].userId;
		let firstPanelUserId = dbComic.ComicPanels[0].userId;

		if(firstPanelUserId || lastPanelUserId) {
			if(lastPanelUserId) this._UnlockAchievement(common.enums.AchievementType.TopLastPanel, [lastPanelUserId], comicId);
			if(firstPanelUserId) this._UnlockAchievement(common.enums.AchievementType.TopFirstPanel, [firstPanelUserId], comicId);
		}
	}
	async ProcessForComicCompleted(dbComic) {
		let comicId = dbComic.comicId;
		let distinctUserIds = [
			...new Set(dbComic.ComicPanels
				.filter(dbComicPanel => !!dbComicPanel.UserId)
				.map(dbComicPanel => dbComicPanel.UserId)
			)];

		//Anonymous comic
		if(distinctUserIds.length === 0) return;
		
		//Panel position achievements
		let firstPanelUserId = dbComic.ComicPanels[0].UserId;
		if(dbComic.ComicPanels.length >= 6 && firstPanelUserId) {
			//Sandwich
			let panelsByUser = dbComic.ComicPanels.find(dbComicPanel => dbComicPanel.UserId === firstPanelUserId);
			let lastPanelUserId = dbComic.ComicPanels[dbComic.ComicPanels.length - 1].UserId;
			if(panelsByUser.length === 2 && firstPanelUserId === lastPanelUserId) {
				this._UnlockAchievement(common.enums.AchievementType.Sandwich, [firstPanelUserId], comicId);
			}
		}

		//If anyone doesn't have firstcomic achievement, unlock it
		this._UnlockAchievement(common.enums.AchievementType.FirstComic, distinctUserIds, comicId);
		
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
			this._UnlockAchievement(common.enums.AchievementType.FirstTemplateUsage, distinctUserIds, comicId);
		}

		//Unique authors
		if(dbComic.ComicPanels.length >= 8 && distinctUserIds.length === dbComic.ComicPanels.length) {
			this._UnlockAchievement(common.enums.AchievementType.AllUniqueAuthors, distinctUserIds, comicId)
		} else {
			distinctUserIds.forEach(distinctUserId => {
				let panelCount = dbComic.ComicPanels.filter(dbComicPanel => dbComicPanel.UserId === distinctUserId).length;
				if(panelCount >= 3) {
					this._UnlockAchievement(common.enums.AchievementType.ThreePanelsOneComic, [distinctUserId], comicId);
				} else if (panelCount >= 2) {
					this._UnlockAchievement(common.enums.AchievementType.TwoPanelsOneComic, [distinctUserId], comicId);
				}
			});

			if(distinctUserIds.length === 3) {
				this._UnlockAchievement(common.enums.AchievementType.ThreeUniqueAuthors, distinctUserIds, comicId);
			}
		}

		//Completed speed
		let createdMoment = moment(dbComic.CreatedAt);
		let completedMoment = moment(dbComic.CompletedAt);
		if(moment.duration(createdMoment.diff(completedMoment)).asHours() <= 1) {
			this._UnlockAchievement(common.enums.AchievementType.FastComic, distinctUserIds, comicId);
		}

		//Panel uniqueness
		let uniqueTemplatePanelIds = [...new Set(dbComic.ComicPanels.map(dbComicPanel => dbComicPanel.TemplatePanelId))];
		if(dbComic.ComicPanels.length >= 8 && uniqueTemplatePanelIds.length === dbComic.ComicPanels.length) {
			this._UnlockAchievement(common.enums.AchievementType.AllUniquePanels, distinctUserIds, comicId);
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
				this._UnlockAchievement(common.enums.AchievementType.MajorPanelStreak, streakUserIds, comicId);
			} else if (streakDbComicPanels.length === 3) {
				this._UnlockAchievement(common.enums.AchievementType.MinorPanelStreak, streakUserIds, comicId);
			}
		});
		
		this.CheckAccumaltiveComicAchievements(distinctUserIds);
	}
	async CheckAccumaltiveComicAchievements(userIds) {
		const accumaltiveAchievementTypes = [
			common.enums.AchievementType.LotsOfTemplates,
			common.enums.AchievementType.LotsOfLastPanels,
			common.enums.AchievementType.LotsOfFirstPanels,
			common.enums.AchievementType.LotsOfComics,
			common.enums.achievementType.HighTotalRating
		];

		let dbUsersToCheck = await this.models.User.findAll({
			where: {
				UserId: {
					[Sequelize.Op.in]: userIds
				}
			},
			include: [{
				model: this.models.UserAchievement,
				as: 'UserAchievements',
				where: {
					Type: {
						[Sequelize.Op.in]: accumaltiveAchievementTypes
					}
				}
			}]
		});

		let achievementsToUpdate = [];

		//For each user that hasn't got all the accumaltive achievements
		dbUsersToCheck.forEach(async dbUser => {
			let lockedAchievementTypesForUser = accumaltiveAchievementTypes.filter(accumaltiveAchievementType => {
				let existingUnlockedAchievement = dbUser.UserAchievements.find(dbUserAchievement => !!dbUserAchievement.UnlockedAt && dbUserAchievement.Type === accumaltiveAchievementType);
				return !existingUnlockedAchievement;
			});

			//User has all the accumaltive achievements, move onto the next
			if(lockedAchievementTypesForUser.length === 0) return; 

			//A bit excessive, consider refactoring
			let userStats = await this.services.Comic.GetStatsForUser(dbUser.UserId);

			let checkAccumaltiveAchievement = async (achievementType, unlockValue, getNewValueIntFn) => {
				//User has the achivement already, move on
				if(!lockedAchievementTypesForUser.includes(achievementType)) return;

				let dbExistingUserAchievement = dbUser.UserAchievements.find(dbUserAchievement => dbUserAchievement.Type === achievementType);
				let newValueInt = getNewValueIntFn();

				//Update the achievement to the new value if required
				if(!dbExistingUserAchievement || dbExistingUserAchievement.ValueInt !== newValueInt) {
					//This will go in an updatable bulkcreate which only updates 'ValueInt'
					//TODO check if it does 'UpdatedAt' too
					achievementsToUpdate.push({
						UserAchievementId: dbExistingUserAchievement 
							? dbExistingUserAchievement.UserAchievementId
							: null,
						UserId: dbUser.UserId,
						AchievementType: achievementType,
						ValueInt: newValueInt
					});

					if(newValueInt >= unlockValue) {
						this._UnlockAchievement(achievementType, [dbUser.UserId])
					}
				}
			};
	
			checkAccumaltiveAchievement(common.enums.AchievementType.LotsOfTemplates, 100, () => Object.keys(userStats.templateUsageLookup).length);
			checkAccumaltiveAchievement(common.enums.AchievementType.LotsOfLastPanels, 500, () => userStats.lastPanelCount);
			checkAccumaltiveAchievement(common.enums.AchievementType.LotsOfFirstPanels, 500, () => userStats.firstPanelCount);
			checkAccumaltiveAchievement(common.enums.AchievementType.LotsOfComics, 1500, () => userStats.comicCount);
			checkAccumaltiveAchievement(common.enums.AchievementType.HighTotalRating, 5000, () => userStats.comicTotalRating);
		});
		
		if(achievementsToUpdate.length > 0) {
			await this.models.UserAchievement.bulkCreate(achievementsToUpdate, {
				updateOnDuplicate: ['ValueInt']
			});
		}
	}
	async ProcessForTopUsers(userIds) {
		this._UnlockAchievement(common.enums.AchievementType.TopUser, userIds);
	}
	async _UnlockAchievement(achievementType, userIds, comicId) {
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
		let newAchievementUserIds = [];
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

				newAchievementUserIds.push(userId);

			} else if(!dbExistingUserAchievement.UnlockedAt) {
				//Row found, but not achieved yet (accumaltive). Use PK to update
				createPromises.push({
					UserAchievementId: dbExistingUserAchievement.UserAchievementId,
					UnlockedAt: now,
					ComicId: comicId
				});

				newAchievementUserIds.push(userId);

			}
		});

		//No await
		this.models.UserAchievement.bulkCreate(createPromises, {
			updateOnDuplicate: ['UnlockedAt']
		});

		if(newAchievementUserIds.length > 0) {
			this.services.Notification.SendAchievementUnlockedNotification(newAchievementUserIds, achievementType);
		}
	}
}