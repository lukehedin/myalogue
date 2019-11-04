import common from '../common';
import { CronJob } from 'cron';

import Service from './Service';

export default class CronService extends Service {
	RegisterJobs() {
		const jobs = [];
		
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
}