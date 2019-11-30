import Sequelize from 'sequelize';
import moment from 'moment';

import common from '../common';

import Service from './Service';

export default class AchievementService extends Service {
	async ProcessForTopComic(dbComic) {
		let comicId = dbComic.ComicId;

		let distinctUserIds = [
			...new Set(dbComic.ComicPanels
				.filter(dbComicPanel => !!dbComicPanel.UserId)
				.map(dbComicPanel => dbComicPanel.UserId)
			)];

		//Top of leaderboard comic
		await this._UnlockAchievement(common.enums.AchievementType.TopComic, distinctUserIds, comicId);

		//Panel position achievements
		let lastPanelUserId = dbComic.ComicPanels[dbComic.ComicPanels.length - 1].UserId;
		let firstPanelUserId = dbComic.ComicPanels[0].UserId;

		if(firstPanelUserId || lastPanelUserId) {
			if(firstPanelUserId) await this._UnlockAchievement(common.enums.AchievementType.TopFirstPanel, [firstPanelUserId], comicId);
			if(lastPanelUserId) await this._UnlockAchievement(common.enums.AchievementType.TopLastPanel, [lastPanelUserId], comicId);
		}
	}
	async ProcessForComicCompleted(dbComic) {
		//This dbComic will only have .ComicPanels, no users or other data.

		let comicId = dbComic.ComicId;
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
			let lastPanelUserId = dbComic.ComicPanels[dbComic.ComicPanels.length - 1].UserId;
			let panelsByUser = dbComic.ComicPanels.filter(dbComicPanel => dbComicPanel.UserId === firstPanelUserId);
			if(panelsByUser.length === 2 && firstPanelUserId === lastPanelUserId) {
				await this._UnlockAchievement(common.enums.AchievementType.Sandwich, [firstPanelUserId], comicId);
			}
		}

		//If anyone doesn't have firstcomic achievement, unlock it
		await this._UnlockAchievement(common.enums.AchievementType.FirstComic, distinctUserIds, comicId);
		
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
			await this._UnlockAchievement(common.enums.AchievementType.FirstTemplateUsage, distinctUserIds, comicId);
		}

		//Unique authors
		if(dbComic.ComicPanels.length >= 8 && distinctUserIds.length === dbComic.ComicPanels.length) {
			await this._UnlockAchievement(common.enums.AchievementType.AllUniqueAuthors, distinctUserIds, comicId)
		} else {
			distinctUserIds.forEach(async distinctUserId => {
				let panelCount = dbComic.ComicPanels.filter(dbComicPanel => dbComicPanel.UserId === distinctUserId).length;
				if(panelCount >= 3) {
					await this._UnlockAchievement(common.enums.AchievementType.ThreePanelsOneComic, [distinctUserId], comicId);
				} else if (panelCount >= 2) {
					await this._UnlockAchievement(common.enums.AchievementType.TwoPanelsOneComic, [distinctUserId], comicId);
				}
			});

			if(distinctUserIds.length === 3) {
				await this._UnlockAchievement(common.enums.AchievementType.ThreeUniqueAuthors, distinctUserIds, comicId);
			}
		}

		//Completed speed
		let createdMoment = moment(dbComic.CreatedAt);
		let completedMoment = moment(dbComic.CompletedAt);
		if(Math.abs(moment.duration(createdMoment.diff(completedMoment)).asHours()) <= 1) {
			await this._UnlockAchievement(common.enums.AchievementType.FastComic, distinctUserIds, comicId);
		}

		//Panel uniqueness
		let uniqueTemplatePanelIds = [...new Set(dbComic.ComicPanels.map(dbComicPanel => dbComicPanel.TemplatePanelId))];
		if(dbComic.ComicPanels.length >= 8 && uniqueTemplatePanelIds.length === dbComic.ComicPanels.length) {
			await this._UnlockAchievement(common.enums.AchievementType.AllUniquePanels, distinctUserIds, comicId);
		}

		//Panel streaks
		let streakDbComicPanels = [];
		dbComic.ComicPanels.forEach(async dbComicPanel => {
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
				await this._UnlockAchievement(common.enums.AchievementType.MajorPanelStreak, streakUserIds, comicId);
			} else if (streakDbComicPanels.length === 3) {
				await this._UnlockAchievement(common.enums.AchievementType.MinorPanelStreak, streakUserIds, comicId);
			}
		});
		

		//Do not await this, these achievements will not display on the comic itself
		this.CheckAccumaltiveComicAchievements(distinctUserIds, [
			common.enums.AchievementType.LotsOfTemplates,
			common.enums.AchievementType.LotsOfLastPanels,
			common.enums.AchievementType.LotsOfFirstPanels,
			common.enums.AchievementType.LotsOfComics
		]);
	}
	async CheckAccumaltiveComicAchievements(userIds, accumaltiveAchievementTypes) {
		const accumaltiveAchievements = this.GetAll().filter(achievement => accumaltiveAchievementTypes.includes(achievement.type));

		let dbUsersToCheck = await this.models.User.findAll({
			where: {
				UserId: {
					[Sequelize.Op.in]: userIds
				}
			},
			include: [{
				required: false,
				model: this.models.UserAchievement,
				as: 'UserAchievements',
				where: {
					Type: {
						[Sequelize.Op.in]: accumaltiveAchievementTypes
					}
				}
			}]
		});

		//For each user that hasn't got all the accumaltive achievements
		dbUsersToCheck.forEach(async dbUser => {
			let lockedAchievementTypesForUser = accumaltiveAchievementTypes.filter(accumaltiveAchievementType => {
				return !dbUser.UserAchievements.find(dbUserAchievement => dbUserAchievement.Type === accumaltiveAchievementType);
			});

			//User has all the accumaltive achievements, move onto the next
			if(lockedAchievementTypesForUser.length === 0) return; 

			let checkAccumaltiveAchievement = async (achievementType, userStats) => {
				let achievement = accumaltiveAchievements.find(accumaltiveAchievement => accumaltiveAchievement.type === achievementType);
				
				//User has the achivement already (or achievement with targetvalue not found), move on
				if(!lockedAchievementTypesForUser.includes(achievementType) || !achievement || !achievement.targetValue) return;

				let dbExistingUserAchievement = dbUser.UserAchievements.find(dbUserAchievement => dbUserAchievement.Type === achievementType);

				//If there is no existinguserachievement and we've passed the unlock value, give it
				if(!dbExistingUserAchievement && achievement.getValue(userStats) >= achievement.targetValue) {
					await this._UnlockAchievement(achievementType, [dbUser.UserId])
				}
			};

			//A bit excessive, consider refactoring
			let userStats = await this.services.User.GetStatsForUser(dbUser.UserId);
	
			accumaltiveAchievementTypes.forEach(async accumaltiveAchievementType => await checkAccumaltiveAchievement(accumaltiveAchievementType, userStats));
		});
	}
	async ProcessForTopUsers(userIds) {
		this._UnlockAchievement(common.enums.AchievementType.TopUser, userIds);
	}
	async _UnlockAchievement(achievementType, userIds, comicId) {
		//Get all the relevant userachievements matching this type and these userids
		let dbExistingUserAchievements = await this.models.UserAchievement.findAll({
			where: {
				Type: achievementType,
				UserId: {
					[Sequelize.Op.in]: userIds
				}
			}
		});

		let achievementsToCreate = [];
		userIds.forEach(userId => {
			let dbExistingUserAchievement = dbExistingUserAchievements.find(dbExistingUserAchievement => dbExistingUserAchievement.UserId === userId);

			//Already has achievement
			if(dbExistingUserAchievement) return;

			//No achievement, create the achievement
			achievementsToCreate.push({
				UserId: userId,
				Type: achievementType,
				ComicId: comicId
			});
		});

		if(achievementsToCreate.length > 0) {
			//No await
			let newAchievementUserIds = achievementsToCreate.map(achievementToCreate => achievementToCreate.UserId);

			await this.models.UserAchievement.bulkCreate(achievementsToCreate);

			this.services.Notification.SendAchievementUnlockedNotification(newAchievementUserIds, achievementType);

			console.log('Achievement unlocked:' + achievementType + ' for ' + newAchievementUserIds.length + ' users, on comic id ' + comicId);
		}
	}
	GetAll() {
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
			targetValue: 1500,
			getValue: userStats => userStats.comicCount
		}, {
			type: common.enums.AchievementType.LotsOfTemplates,
			name: 'Versatile voice',
			description: 'Use 100 different templates',
			targetValue: 100,
			getValue: userStats => Object.keys(userStats.templateUsageLookup).length
		}, {
			type: common.enums.AchievementType.HighTotalRating,
			name: 'Critically acclaimed',
			description: 'Reach a total comic rating of 5000',
			targetValue: 5000,
			getValue: userStats => userStats.comicTotalRating
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
			description: 'Feature in a comic with 8 or more unique template panels'
		}, {
			type: common.enums.AchievementType.MinorPanelStreak,
			name: 'Déjà vu',
			description: 'Be part of a streak of 3 identical template panels'
		}, {
			type: common.enums.AchievementType.MajorPanelStreak,
			name: 'Groundhog day',
			description: 'Be part of a streak of 4 identical template panels'
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
			targetValue: 500,
			getValue: userStats => userStats.firstPanelCount
		}, {
			type: common.enums.AchievementType.LotsOfLastPanels,
			name: 'Last but not least',
			description: 'Make the last panel for 500 comics',
			targetValue: 500,
			getValue: userStats => userStats.lastPanelCount
		}, {
			type: common.enums.AchievementType.LotsOfRatings,
			name: 'Quality control',
			description: 'Rate 1000 comics',
			targetValue: 1000,
			getValue: userStats => userStats.ratingCount
		}, {
			type: common.enums.AchievementType.LotsOfRatingsForOthers,
			name: 'Everyone\'s a critic',
			description: 'Rate 500 comics that you aren\'t featured in',
			targetValue: 500,
			getValue: userStats => userStats.ratingCountForOthers
		}];
	}
	GetByType(achievementType) {
		return this.GetAll().find(achievement => achievement.type === achievementType);
	}
}