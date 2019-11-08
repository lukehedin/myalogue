import common from '../common';
import RedditScore from 'reddit-score';
import { Sequelize } from 'sequelize';
import { CronJob } from 'cron';

import Service from './Service';

export default class CronService extends Service {
	RegisterJobs() {
		const jobs = [{
			name: 'Update hot ranks',
			time: '*/10 * * * *', //Every 10th minute
			fn: () => this.UpdateHotRanks()
		}];
		
		// {
		// 	name: 'Update user statistics',
		// 	time: '40 * * * *', //Every hour at 0 minutes
		// 	fn: () => this.UpdateUserStatistics
		// }

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
	async UpdateUserStatistics(now) {
		let dbUsers = await this.models.User.findAll();
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
}