import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';
import moment from 'moment';

import ComicList from '../../UI/ComicList/ComicList';
import UserAvatar from '../../UI/UserAvatar/UserAvatar';
import TabbedPanels from '../../UI/TabbedPanels/TabbedPanels';
import AchievementList from '../../UI/AchievementList/AchievementList';
import GroupList from '../../UI/GroupList/GroupList';
import StatsSummary from '../../UI/StatsSummary/StatsSummary';

//this.props.userIdOrUserName
export default class ProfilePage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			user: null,
			groups: null,
			userStats: null,
			userAchievements: null,
			userAchievementProgress: null
		};
	}
	componentDidMount() {
		this.fetchData();
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.userIdOrUserName !== prevProps.userIdOrUserName;
	}
	componentDidUpdate(prevProps, prevState, isNewUserIdOrUsername) {
		if(isNewUserIdOrUsername) this.fetchData();
	}
	fetchData() {
		this.setState({
			isLoading: true
		});
		
		Util.api.post('/api/getUser', isNaN(this.props.userIdOrUserName)
			? { requestedUsername: this.props.userIdOrUserName }
			: { requestedUserId: this.props.userIdOrUserName }
		)
		.then(result => {
			if(!result.error) {
				this.setState({
					user: result.user,
					userStats: result.userStats,
					userAchievements: result.userAchievements,
					userAchievementProgress: result.userAchievementProgress
				});
			}

			this.setState({
				isLoading: false
			})
		});
	}
	render() {
		let isMe = this.state.user && Util.context.isUserId(this.state.user.userId);

		return <div className="page-profile">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<div className="page-profile-inner">
							{this.state.isLoading
								? <div className="loader"></div>
								: this.state.user
									? <div className="user-info">
										<div className="user-info-header">
											<UserAvatar className="avatar-lg" user={this.state.user} size={96} to={isMe ? Util.route.settings() : null} />
											<div className="user-info-header-detail">
												<h2 className="user-name">{this.state.user.username}</h2>
												<p className="joined-date sm">Joined {moment(this.state.user.createdAt).fromNow()}</p>
											</div>
										</div>
										<TabbedPanels tabs={[{
											tabId: 'details',
											title: 'Details',
											content: <div className="user-details">
												<StatsSummary 
													totalRating={this.state.userStats.comicTotalRating} 
													panelCount={this.state.userStats.panelCount}
													comicCount={this.state.userStats.comicCount}
												/>
												<GroupList limit={5} emptyText={`${this.state.user.username} isn't a member of any groups.`} forUserId={this.state.user.userId} />
											</div>
										}, {
											tabId: 'achievements',
											title: 'Achievements',
											content: <AchievementList userAchievements={this.state.userAchievements} userAchievementProgress={this.state.userAchievementProgress} />
										}, {
											tabId: 'templates',
											title: 'Templates',
											content: <table className="template-usage-table">
												<thead>
													<tr>
														<th>Template</th>
														<th>Usages</th>
													</tr>
												</thead>
												<tbody>
													{[...Util.context.getTemplates()]
													.sort((t1, t2) => {
														return (this.state.userStats.templateUsageLookup[t2.templateId] || 0) - (this.state.userStats.templateUsageLookup[t1.templateId] || 0)
													})
													.map((template, idx)=> {
														let amountUsed = this.state.userStats.templateUsageLookup[template.templateId] || 0;
														return <tr key={idx} className="template-usage-row">
															<td className="td-template-name">
																<Link to={Util.route.template(template.templateId)}>{template.name}</Link>
															</td>
															<td className="td-template-usages">
																{amountUsed || null}
															</td>
														</tr>
													})}
												</tbody>
											</table>
										}]}
										/>
										<ComicList 
											sortBy={Util.enums.ComicSortBy.Newest}
											title={`Comics featuring ${this.state.user.username}`} 
											authorUserId={this.state.user.userId} 
										/>
									</div>
									: <p className="empty-text">User not found.</p>
							}
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}