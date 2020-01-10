import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import TabbedPanels from '../../UI/TabbedPanels/TabbedPanels';
import TeamList from '../../UI/TeamList/TeamList';

export default class TeamsPage extends Component {
	render() {
		return <div className="page-teams">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h1 className="page-title">Teams</h1>
						<p><Link to={Util.route.teamEditor()}>Create a new team</Link> or request to join an existing one to make comics with other team members. Work together to get to the top of the <Link to={Util.route.leaderboards('teams')}>team leaderboard</Link>.</p>
						<TabbedPanels tabs={[{
							content: <TeamList />
						}]} />
					</div>
				</div>
			</div>
		</div>;
	}
}