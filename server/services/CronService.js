import common from '../common';
import RedditScore from 'reddit-score';
import { Sequelize } from 'sequelize';
import { CronJob } from 'cron';
import moment from 'moment';

import Service from './Service';

export default class CronService extends Service {
	RegisterJobs() {
		const jobs = [{
			name: 'Update hot ranks',
			time: '2-59/10 * * * *', //At every 10th minute from 2 through 59
			fn: () => this.UpdateHotRanks()
		// }, {
		// 	name: 'Check user achievements',
		// 	time: '6-59/10 * * * *', //At every 10th minute from 6 through 59
		// 	fn: () => this.CheckUserAchievements()
		// }, {
		// 	name: 'Update leaderboards',
		// 	time: '0 * * * *', //At minute 0 (hourly)
		// 	fn: () => this.UpdateLeaderboards()
		}];

		jobs.forEach(job => {
			new CronJob(job.time, async () => {
				let now = new Date();
				console.log(`Cronjobs: Running - "${job.name}"`);
				
				try {
					await job.fn(now);
					console.log(`Cronjobs: Completed - "${job.name}"`);
				} catch(error) {
					console.log(`Cronjobs: Error  - ${error}`);
					
					this.models.Log.create({
						Type: 'CRONJOB ERROR',
						Message: error.toString()
					});
				}
			}, null, true, 'Australia/Melbourne');
		});
		console.log('CronJobs: Cronjobs registered');
	}
	async UpdateHotRanks() {		
		let dbComics = await this.models.Comic.findAll({
			where: {
				CompletedAt: {
					[Sequelize.Op.ne]: null
				}
			},
			order: [['CompletedAt', 'ASC']]
		});

		if(dbComics.length < 1) return;

		let comicsToUpdate = [];
		let redditScore = new RedditScore;

		dbComics.forEach(dbComic => {
			//Tweaked from https://github.com/kamilkisiela/reddit-score-js/blob/master/index.js#L12
			// (Used the rating upfront rather than up - down votes)
			const score = dbComic.Rating;

			let order = redditScore.order(score);
			let sign = redditScore.sign(score);
			let seconds = redditScore.seconds(dbComic.CompletedAt) - redditScore.base;
			let result = sign * order + seconds / 45000;
			
			let hotRank = Math.round(Math.pow(10, 7) * result) / Math.pow(10, 7);

			comicsToUpdate.push({
				ComicId: dbComic.ComicId,
				HotRank: hotRank
			});
		});

		await this.models.Comic.bulkCreate(comicsToUpdate, {
		 	updateOnDuplicate: ['HotRank']
		});
	}
	async CheckUserAchievements() {
		const achievementTypesToCheck = [
			common.enums.AchievementType.LotsOfLastPanels,
			common.enums.AchievementType.LotsOfFirstPanels,
			common.enums.AchievementType.LotsOfTemplates,
			common.enums.AchievementType.LotsOfComics
		];

		let dbUsersToCheck = await this.models.User.findAll({
			where: {
				IsAchievementCheckRequired: true
			},
			include: [{
				model: this.models.UserAchievement,
				as: 'UserAchievements',
				where: {
					Type: {
						[Sequelize.Op.in]: achievementTypesToCheck
					}
				}
			}]
		});

		//For each user that hasn't got all the worker achievements
		dbUsersToCheck.forEach(async dbUser => {
			let lockedAchievementTypesForUser = achievementTypesToCheck.filter(achievementType => {
				return !dbUser.UserAchievements.find(dbUserAchievement => dbUserAchievement.Type === achievementType);
			});

			//User has all the worker achievements
			if(lockedAchievementTypesForUser.length === 0) return; 

			let userStats = await this.services.Comic.GetStatsForUser(dbUser.UserId);

			let checkAchievement = async (achievementType, checkFn) => {
				dbUserAchievementsToCheck
					.filter(dbUserAchievement => dbUserAchievement.Type === achievementType)
					.forEach(dbUserAchievement => checkFn(dbUserAchievement))
			};
	
			checkAchievement(common.enums.AchievementType.LotsOfTemplates, async (dbUserAchievement) => {
				
				let uniqueTemplateCount = userStats.distinctTemplateIds.length;
				
			});

			if(lockedAchievementTypesForUser.includes(common.enums.AchievementType.LotsOfTemplates)) {
				let dbExistingUserAchievement = dbUser.UserAchievements.find(dbUserAchievement => dbUserAchievement.Type === common.enums.AchievementType.LotsOfTemplates);

				if(dbUserAchievement.ValueInt !== uniqueTemplateCount) {
					achievementsToUpdate.push({
						UserAchievementId: dbUserAchievement.UserAchievementId,
						ValueInt: uniqueTemplateCount
					});
				}
				if(uniqueTemplateCount >= 100) {
					this.services.Achievement.UnlockAchievement(common.enums.achievementType.LotsOfTemplates, [dbUser.UserId])
				}
			}
		});
		
		console.log('applying worker achivement updates');
		await this.models.UserAchievement.bulkCreate(achievementsToUpdate, {
			updateOnDuplicate: ['ValueInt']
		});
	}
	async UpdateLeaderboards() {
		let dbWeeklyComics = await this.models.Comic.findAll({
			where: {
				CompletedAt: {
					[Sequelize.Op.ne]: null,
					[Sequelize.Op.gte]: moment().subtract(2, 'week').toDate() //TODO make 1 week
				}
			},
			order: [
				[ 'Rating', 'DESC'],
				[ 'CompletedAt', 'DESC' ] // a newer comic tie will beat an older comic (it got more ratings in shorter time)
			],
			include: [{
				model: this.models.ComicPanel,
				as: 'ComicPanels',
				include: [{
					model: this.models.User,
					as: 'User'
				}]
			}]
		});

		if(dbWeeklyComics.length > 0) {
			let dbTopComic = dbWeeklyComics[0];
			let topComicId = dbTopComic.ComicId;

			//Update leaderboard ratings
			await this.models.Comic.bulkCreate(dbWeeklyComics.map(dbWeeklyComic => {
				return {
					ComicId: dbWeeklyComic.ComicId,
					LeaderboardRating: dbWeeklyComic.Rating
				}
			}), {
				updateOnDuplicate: ['LeaderboardRating']
			});

			//If this is the first time the comic has been at the top of the leaderboard
			if(!dbTopComic.LeaderboardTopAt) {
				await this.models.Comic.update({
					LeaderboardTopAt: new Date()
				}, {
					where: {
						ComicId: dbTopComic.ComicId
					}
				});
	
				let distinctUserIds = [
					...new Set(dbTopComic.ComicPanels
						.filter(dbComicPanel => !!dbComicPanel.UserId)
						.map(dbComicPanel => dbComicPanel.UserId)
					)];

				//Top of leaderboard comic
				this.services.Achievement.UnlockAchievement(common.enums.AchievementType.TopComic, distinctUserIds, topComicId);
		
				//Panel position achievements
				let lastPanelUserId = dbTopComic.ComicPanels[dbTopComic.ComicPanels.length - 1].userId;
				let firstPanelUserId = dbTopComic.ComicPanels[0].userId;
		
				if(firstPanelUserId || lastPanelUserId) {
					if(lastPanelUserId) this.services.Achievement.UnlockAchievement(common.enums.AchievementType.TopLastPanel, [lastPanelUserId], topComicId);
					if(firstPanelUserId) this.services.Achievement.UnlockAchievement(common.enums.AchievementType.TopFirstPanel, [firstPanelUserId], topComicId);
				}
			}

			//Calculate user leaderboard from these comics
			let userScoreLookup = {};
			dbWeeklyComics.forEach(dbWeeklyComic => {
				if(dbWeeklyComic.Rating > 0) {
					dbWeeklyComic.ComicPanels.forEach(dbComicPanel => {
						let userId = dbComicPanel.UserId;
						if(userId && !dbComicPanel.CensoredAt) {
							userScoreLookup[userId] = userScoreLookup[userId] 
								? userScoreLookup[userId] + dbWeeklyComic.Rating 
								: dbWeeklyComic.Rating;
						}
					})
				}
			});

			let weeklyUserIds = Object.keys(userScoreLookup);
			
			if(weeklyUserIds.length > 0) {
		
				//Update user leaderboard ratings and reset all other users leaderboardrating to 0
				await Promise.all([
					this.models.User.bulkCreate(weeklyUserIds.map(userId => {
						return {
							UserId: userId,
							LeaderboardRating: userScoreLookup[userId]
						}
					}), {
						updateOnDuplicate: ['LeaderboardRating']
					}),
					this.models.User.update({
						LeaderboardRating: 0
					}, {
						where: {
							UserId: {
								[Sequelize.Op.notIn]: weeklyUserIds
							}
						}
					})
				]);

				let topUserRating = weeklyUserIds.reduce((max, userId) => userScoreLookup[userId] > max ? userScoreLookup[userId] : max, 0);
				
				let dbTopUsers = await this.models.User.findAll({
					where: {
						LeaderboardRating: topUserRating
					}
				});

				let topUserIds = dbTopUsers.map(dbTopUser => dbTopUser.UserId);
				this.services.Achievement.UnlockAchievement(common.enums.AchievementType.TopAuthor, topUserIds);

				//Record as the first time the user got leaderboardtop, if they havent already
				await this.models.User.update({
					LeaderboardTopAt: new Date()
				}, {
					where: {
						UserId: {
							[Sequelize.Op.in]: topUserIds
						},
						LeaderboardTopAt: {
							[Sequelize.Op.eq]: null
						}
					}
				});
				console.log('B');
			}
		}
	}
}