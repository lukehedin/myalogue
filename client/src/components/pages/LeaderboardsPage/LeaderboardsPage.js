import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import ComicInfoLabel from '../../UI/ComicInfoLabel/ComicInfoLabel';
import UserAvatar from '../../UI/UserAvatar/UserAvatar';
import TabbedPanels from '../../UI/TabbedPanels/TabbedPanels';
import GroupAvatar from '../../UI/GroupAvatar/GroupAvatar';

export default class LeaderboardsPage extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true,
			leaderboard: {}
		}
	}
	componentDidMount() {
		Util.api.post('/api/getLeaderboards')
			.then(result => {
				if(!result.error) {
					this.setState({
						leaderboard: result
					});
				}

				this.setState({
					isLoading: false
				})
			});
	}
	render() {
		let leaderboardTabs = [{
			tabId: 'comics',
			title: 'Comics',
			content: Util.array.any(this.state.leaderboard.comics)
				? <div>
					<p className="table-info sm">The highest rated comics completed within the past week.</p>
					<table className="leaderboard-table">
						<tbody>
							{this.state.leaderboard.comics.map((leaderboardComic, idx) => {
								let featuresMe = !!leaderboardComic.comicPanels.find(comicPanel => comicPanel.user && Util.context.isUserId(comicPanel.user.userId));
								return <tr key={leaderboardComic.comicId} className={`leaderboard-item leaderboard-comic ${featuresMe ? 'leaderboard-highlight' : ''}`}>
									<td>
										<h4>{idx + 1}.</h4>
										<div className="leaderboard-item-detail">
											<h4><Link to={Util.route.comic(leaderboardComic.comicId)}>Comic #{leaderboardComic.comicId}</Link> - {leaderboardComic.title}</h4>
											<ComicInfoLabel comic={leaderboardComic} />
											<p className="sm rating"><b>Rating</b>: {leaderboardComic.leaderboardRating}</p>
										</div>
									</td>
								</tr>
							})}
						</tbody>
					</table>
				</div>
				: <p className="empty-text align-center">No leaderboard comics to show.</p>
		}, {
			tabId: 'users',
			title: 'Users',
			content: Util.array.any(this.state.leaderboard.users)
				? <div>
					<p className="table-info sm">The users with the highest total rating for comics completed in the past week.</p>
					<table className="leaderboard-table">
						<tbody>
							{this.state.leaderboard.users.map((leaderboardUser, idx) => {
								//Placement may be same as the previous user (tied score)
								let placement = idx + 1;
								if(idx !== 0) {
									let compareIdx = idx - 1;
									while(compareIdx >= 0 && leaderboardUser.leaderboardRating === this.state.leaderboard.users[compareIdx].leaderboardRating) {
										placement = compareIdx + 1;
										compareIdx--;
									}
								}

								return <tr key={leaderboardUser.userId} className={`leaderboard-item leaderboard-user ${Util.context.isUserId(leaderboardUser.userId) ? 'leaderboard-highlight' : ''}`}>
									<td>
										<h4>{placement}.</h4>
										<UserAvatar size={32} to={Util.route.profile(leaderboardUser.username)} user={leaderboardUser} />
										<div className="leaderboard-item-detail">
											<h4 className="username"><Link to={Util.route.profile(leaderboardUser.username)}>{leaderboardUser.username}</Link></h4>
											<p className="sm rating"><b>Weekly rating</b>: {leaderboardUser.leaderboardRating}</p>
										</div>
									</td>
								</tr>
							})}
						</tbody>
					</table>
				</div>
				: <p className="empty-text align-center">No leaderboard users to show.</p>
		}, {
			tabId: 'groups',
			title: 'Groups',
			content: Util.array.any(this.state.leaderboard.groups)
				? <div>
					<p className="table-info sm">The groups with the highest total rating for comics completed in the past week.</p>
					<table className="leaderboard-table">
						<tbody>
							{this.state.leaderboard.groups.map((leaderboardGroup, idx) => {
								//Placement may be same as the previous group (tied score)
								let placement = idx + 1;
								if(idx !== 0) {
									let compareIdx = idx - 1;
									while(compareIdx >= 0 && leaderboardGroup.leaderboardRating === this.state.leaderboard.groups[compareIdx].leaderboardRating) {
										placement = compareIdx + 1;
										compareIdx--;
									}
								}

								return <tr key={leaderboardGroup.groupId} className={`leaderboard-item leaderboard-group ${Util.context.isInGroup(leaderboardGroup.groupId) ? 'leaderboard-highlight' : ''}`}>
									<td>
										<h4>{placement}.</h4>
										<GroupAvatar size={32} to={Util.route.group(leaderboardGroup.groupId)} group={leaderboardGroup} />
										<div className="leaderboard-item-detail">
											<h4 className="group-name"><Link to={Util.route.group(leaderboardGroup.groupId)}>{leaderboardGroup.name}</Link></h4>
											<p className="sm rating">{leaderboardGroup.isPublic ? 'Public' : 'Private'} group • {leaderboardGroup.memberCount} {Util.format.pluralise(leaderboardGroup.memberCount, 'member')}</p>
											<p className="sm rating"><b>Weekly rating</b>: {leaderboardGroup.leaderboardRating}</p>
										</div>
									</td>
								</tr>
							})}
						</tbody>
					</table>
				</div>
				: <p className="empty-text align-center">No leaderboard groups to show.</p>
		}];

		return <div className="page-leaderboards">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h1 className="page-title">Leaderboards</h1>
						<div className="leaderboards-inner">
							{this.state.isLoading
								? <div className="loader"></div>
								: <div>
									<TabbedPanels tabs={leaderboardTabs} />
									<h6 className="leaderboards-note">Leaderboards and their related achievements are calculated every hour, on the hour.</h6>
								</div>
							}
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}