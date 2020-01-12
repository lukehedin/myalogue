import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import HTMLEllipsis from 'react-lines-ellipsis/lib/html';
import Util from '../../../Util';
import Button from '../Button/Button';

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

		return <div className="team-list">
			{Util.array.any(this.state.teams)
				? this.state.teams.map(team => {
					return <div key={team.teamId} className="team-list-item">
						<Link to={Util.route.team(team.teamId)}><p>{team.name}</p></Link>
						{team.description
							? <HTMLEllipsis
								className="description"
								unsafeHTML={Util.format.userStringToSafeHtml(team.description)}
								maxLine='3'
								ellipsis='...'
								basedOn='letters'
							/>
							: null
						}
						<p className="sm">{team.teamUsers.length} {Util.format.pluralise(team.teamUsers, 'member')}</p>
						{Util.context.isInTeam(team.teamId)
							? null
							: <Button label="Request to join" />
						}
					</div>
				})
				: <p className="empty-text">No teams found.</p>
			}
		</div>
	}
}