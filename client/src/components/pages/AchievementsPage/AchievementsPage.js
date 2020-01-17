import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import AchievementImage from '../../UI/AchievementImage/AchievementImage';
import ProgressBar from '../../UI/ProgressBar/ProgressBar';

export default class AchievementsPage extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true,
			globalAchievements: null
		}
	}
	componentDidMount() {
		Util.api.post('/api/getGlobalAchievements')
			.then(globalAchievements => {
				this.setState({
					isLoading: false,
					globalAchievements
				});
			})
	}
	render() {
		return <div className="page-achievements">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h1 className="page-title">Achievements</h1>
						<p className="page-subtitle">A list of each achievement along with the percent of users who have unlocked it. {Util.context.isAuthenticated() ? <span>For your own achievements, <Link to={Util.route.withQueryParams(Util.route.profile(Util.context.getUserId()), { tabId: 'achievements' })}>visit your profile</Link>.</span> : <span>To start unlocking achievements, <Link to={Util.route.register()}>create an account</Link>.</span>}</p>
						<div className="global-achievements">
							{this.state.isLoading
								? <div className="loader"></div>
								: <div className="global-achievements-inner">
									{Util.context.getAchievements().map(achievement => {
										let percent = this.state.globalAchievements[achievement.type] || 0;

										return <div className="global-achievement" key={achievement.type}>
											<AchievementImage achievementType={achievement.type} />
											<div className="global-achievement-detail">
												<h4 className="achievement-name">{achievement.name}</h4>
												<p className="achievement-description sm">{achievement.description}</p>
												<ProgressBar amount={percent} total={100} label={`unlocked by ${percent}% of users `} />
											</div>
										</div>;
										}
									)}
								</div>
							}
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}