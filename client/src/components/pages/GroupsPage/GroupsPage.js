import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import TabbedPanels from '../../UI/TabbedPanels/TabbedPanels';
import GroupList from '../../UI/GroupList/GroupList';
import GroupRequestsList from '../../UI/GroupRequestsList/GroupRequestsList';

export default class GroupsPage extends Component {
	render() {
		return <div className="page-groups">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<div className="groups-page-inner">
							<h1 className="page-title">Groups</h1>
							<p className="page-subtitle"><Link to={Util.route.groupEditor()}>Create a new group</Link> or browse existing groups to join and make comics with other group members. Work together to get to the top of the <Link to={Util.route.leaderboards('groups')}>group leaderboard</Link>.</p>
							<TabbedPanels tabs={[{
								tabId: 'groups',
								title: 'My groups',
								content: <GroupList />
							}, {
								tabId: 'browse',
								title: 'Browse',
								content: <GroupList />
							}, {
								tabId: 'requests',
								title: 'Requests',
								content: <GroupRequestsList />
							}]} />
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}