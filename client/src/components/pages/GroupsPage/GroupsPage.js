import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import TabbedPanels from '../../UI/TabbedPanels/TabbedPanels';
import GroupList from '../../UI/GroupList/GroupList';
import GroupPendingInfo from '../../UI/GroupPendingInfo/GroupPendingInfo';

export default class GroupsPage extends Component {
	render() {
		let tabs = [];

		if(Util.context.isAuthenticated()) {
			tabs.push({
				tabId: 'groups',
				title: 'My groups',
				content: <GroupList emptyText="You aren't a member of any groups." forUserId={Util.context.getUserId()} />
			}, {
				tabId: 'requests',
				title: 'Requests', //Also contains invites but this wording works
				content: <GroupPendingInfo />
			})
		}

		tabs.push({
			tabId: 'browse',
			title: 'Browse',
			content: <GroupList />
		});

		return <div className="page-groups">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<div className="groups-page-inner">
							<h1 className="page-title">Groups</h1>
							<p className="page-subtitle"><Link to={Util.route.groupEditor()}>Create a new group</Link> or browse existing groups to join and make comics with other group members. Work together to get to the top of the <Link to={Util.route.withQueryParams(Util.route.leaderboards(), { tabId: 'groups' })}>group leaderboard</Link>.</p>
							<TabbedPanels tabs={tabs} />
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}