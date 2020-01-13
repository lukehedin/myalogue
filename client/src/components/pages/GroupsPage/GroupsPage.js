import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import TabbedPanels from '../../UI/TabbedPanels/TabbedPanels';
import GroupList from '../../UI/GroupList/GroupList';

export default class GroupsPage extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true,

			groups: null,
			requests: null,
			invites: null
		}
	}
	componentDidMount() {
		Util.api.post('/api/getGroupsInfo')
			.then(groupInfo => {
				this.setState({
					isLoading: false,

					groups: groupInfo.groups,
					requests: groupInfo.requests,
					invites: groupInfo.invites
				});
			});
	}
	acceptInvite(groupInviteId) {

	}
	declineInvite(groupInviteId) {
		
	}
	cancelRequest(groupRequestId) {
		
	}
	render() {
		return <div className="page-groups">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						{this.state.isLoading
							? <div className="loader"></div>
							: <div className="groups-page-inner">
								<h1 className="page-title">Groups</h1>
								<p className="page-subtitle"><Link to={Util.route.groupEditor()}>Create a new group</Link> or <Link to={Util.route.groups()}>find an existing group</Link> to join and make comics with other group members. Work together to get to the top of the <Link to={Util.route.leaderboards('groups')}>group leaderboard</Link>.</p>
								<TabbedPanels tabs={[{
									tabId: 'groups',
									title: 'Groups',
									content: Util.array.any(this.state.groups)
										? <GroupList groups={this.state.groups} />
										: <p className="empty-text">You aren't a member of any groups. Why not <Link to={Util.route.groups()}>find a group to join</Link>?</p>
								}, {
									tabId: 'requests',
									title: 'Requests',
									content: Util.array.any(this.state.requests)
										? <div className="group-requests">
											{this.state.requests.map(request => {
												return <div className="group-request">

												</div>
											})}
										</div>
										: <p className="empty-text">No pending group requests.</p>
								}, {
									tabId: 'invites',
									title: 'Invites',
									content: Util.array.any(this.state.invites)
										? <div className="group-invites">
											{this.state.invites.map(invite => {
												return <div className="group-invite">
													
												</div>
											})}
										</div>
										: <p className="empty-text">No group invites.</p>
								}]} />
							</div>
						}
					</div>
				</div>
			</div>
		</div>;
	}
}