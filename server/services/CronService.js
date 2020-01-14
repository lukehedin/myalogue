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
			time: '2-59/5 * * * *', //At every 5th minute from 2 through 59 (10:02, 10:07, 10:12, 10:17, 10:22 etc)
			fn: () => this.UpdateHotRanks()
		}, {
			name: 'Check rating achievements',
			time: '2-59/5 * * * *', //At every 5th minute from 3 through 59 (10:03, 10:08, 10:13, 10:18, 10:23 etc)
			fn: () => this.CheckRatingAchievements()
		}, {
			name: 'Update leaderboards',
			time: '0 * * * *', //At minute 0 (hourly)
			fn: () => this.UpdateLeaderboards()
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
	async UpdateLeaderboards() {
		let dbWeeklyComics = await this.models.Comic.findAll({
			where: {
				CompletedAt: {
					[Sequelize.Op.ne]: null,
					[Sequelize.Op.gte]: moment().subtract(1, 'week').toDate()
				}
			},
			order: [
				[ 'Rating', 'DESC'],
				[ 'CompletedAt', 'DESC' ], // a newer comic tie will beat an older comic (it got more ratings in shorter time)
				[{
					model: this.models.ComicPanel, 
					as: 'ComicPanels'
				}, 'Ordinal', 'ASC']
			],
			include: [{
				model: this.models.ComicPanel,
				as: 'ComicPanels',
				required: false,
				where: {
					CensoredAt: {
						[Sequelize.Op.eq]: null
					}
				}
			}]
		});

		if(dbWeeklyComics.length > 0) {
			let dbTopComic = dbWeeklyComics[0];

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
	
				await this.services.Achievement.ProcessForTopComic(dbTopComic);
			}

			//Calculate user leaderboard from these comics
			let userScoreLookup = {};
			dbWeeklyComics.forEach(dbWeeklyComic => {
				if(dbWeeklyComic.Rating > 0) {
					dbWeeklyComic.ComicPanels.forEach(dbComicPanel => {
						let userId = dbComicPanel.UserId;
						if(userId) {
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

				this.services.Achievement.ProcessForTopUsers(topUserIds);
			}
		}
	}
	async CheckRatingAchievements() {
		let dbComicVotes = await this.models.ComicVote.findAll({
			where: {
				UpdatedAt: {
					[Sequelize.Op.gte]: moment().subtract(1, 'minute').toDate()
				}
			}
		});

		if(dbComicVotes.length === 0) return;

		//Firstly, check if any of the VOTERS have unlocked achievements related to voting
		let voterUserIds = [...new Set(dbComicVotes.map(dbComicVote => dbComicVote.UserId))];
		await this.services.Achievement.CheckAccumaltiveComicAchievements(voterUserIds, [
			common.enums.AchievementType.LotsOfRatings,
			common.enums.AchievementType.LotsOfRatingsForOthers
		]);
		
		//Secondly, check if any people who were AFFECTED by these ratings have new total ratings
		let comicIds = [...dbComicVotes.map(dbComicVote => dbComicVote.ComicId)];

		let dbComicPanels = await this.models.ComicPanel.findAll({
			where: {
				ComicId: {
					[Sequelize.Op.in]: comicIds
				},
				CensoredAt: {
					[Sequelize.Op.eq]: null
				}
			}
		});
		//These are the users who have had their ratings change in the last hour
		let affectedUserIds = [...new Set(dbComicPanels.map(dbComicPanel => dbComicPanel.UserId))];
		await this.services.Achievement.CheckAccumaltiveComicAchievements(affectedUserIds, [
			common.enums.AchievementType.HighTotalRating
		]);
	}
}