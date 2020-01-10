import React, { Component } from 'react';
import Util from '../../../Util';

import Button from '../../UI/Button/Button';
import TabbedPanels from '../../UI/TabbedPanels/TabbedPanels';
import ComicList from '../../UI/ComicList/ComicList';

export default class TeamPage extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true,
			team: null
		}
	}
	componentDidMount() {
		Util.api.post('/api/getTeam', {
			teamId: this.props.teamId
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					team: result
				});
			}

			this.setState({
				isLoading: false
			});
		})
	}
	render() {
		return <div className="page-team">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<div className="page-team-inner">
							{this.state.isLoading
								? <div className="loader"></div>
								: this.state.team 
									? <div>
										<h1 className="page-title">{this.state.team.name}</h1>
										<TabbedPanels tabs={[{
											tabId: 'members',
											content: <div></div>
										}]} />
										<ComicList 
											sortBy={Util.enums.ComicSortBy.Newest}
											title={`Comics by ${this.state.team.name}`} 
											teamId={this.state.team.teamId} 
										/>
									</div>
									: <p className="empty-text">Team not found.</p>
							}
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}