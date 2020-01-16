import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

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
						<p className="page-subtitle">A list containing each achievement along with the percent of users who have unlocked it. {Util.context.isAuthenticated() ? <span>For your own achievements, <Link to={Util.route.withQueryParams(Util.route.profile(Util.context.getUserId()), { tabId: 'achievements' })}>visit your profile</Link>.</span> : <span>To start unlocking achievements, <Link to={Util.route.register()}>create an account</Link>.</span>}</p>
						<div className="achievements">
							{this.state.isLoading
								? <div className="loader"></div>
								: <ul>
									{Util.context.getAchievements().map(achievement => <li key={achievement.type}>{achievement.name} - {this.state.globalAchievements[achievement.type] || 0}</li>)}
								</ul>
							}
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}