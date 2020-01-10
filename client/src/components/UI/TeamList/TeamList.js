import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';
import Avatar from '../Avatar/Avatar';

export default class TeamList extends Component {
	constructor(props) {
		super(props);


		this.state = {
			isLoading: true,
			
			teams: []
		};
	}
	componentDidMount() {
		Util.api.post('/api/getTeams')
			.then(teams => {
				this.setState({
					teams,
					isLoading: false
				});
			});
	}
	render() {
		if(this.state.isLoading) return <div className="loader"></div>;

		return <div className="teams-list">
			{Util.array.any(this.state.teams)
				? this.state.teams.map(team => {
					return <div key={team.teamId} className="team-list-item">
						<div className="team-detail">
							<Link to={Util.route.team(team.teamId)}><p>{team.name}</p></Link>
							<p className="sm">{team.description}</p>
							<p className="sm">{team.teamUsers.length} {Util.format.pluralise(team.teamUsers, 'member')}</p>
						</div>
						<div>
							{team.teamUsers.map(teamUser => <Avatar key={teamUser.teamUserId} size={32} user={teamUser.user} />)}
						</div>
					</div>
				})
				: <p className="empty-text">No teams found.</p>
			}
		</div>
	}
}