import React, { Component } from 'react';
import Util from '../../../Util';

import Button from '../../UI/Button/Button';
import TeamEditorForm from '../../UI/Forms/TeamEditorForm/TeamEditorForm';

export default class TeamEditorPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: !!this.props.teamId,

			team: null
		}
	}
	componentDidMount() {
		if(this.props.teamId) this.fetchTeam();
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.teamId !== prevProps.teamId;
	}
	componentDidUpdate(prevProps, prevState, isNewProps) {
		if(isNewProps) {
			this.setState({
				isLoading: true
			}, this.fetchTeam);
		}
	}
	fetchTeam() {
		Util.api.post('/api/getTeam', {
			teamId: this.props.teamId
		})
		.then(team => {
			this.setState({
				team
			});
		})
	}
	render() {
		return <div className="page-team-editor">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h1 className="page-title">{this.props.teamId ? 'Manage team' : 'Create team'}</h1>
						<div className="team-editor">
							{this.state.isLoading
								? <div className="loader"></div>
								: <div className="team-editor-inner">
									<TeamEditorForm 
										formData={this.state.team || {}}
										onSubmit={(form, formData) => {
											form.setLoading(true);

											Util.api.post('/api/saveTeam', {
												team: formData
											})
											.then(updatedTeam => {
												this.setState({
													team: updatedTeam
												});
												
												form.setLoading(false);
											});
										}}
									/>
									{this.state.team && this.state.team.teamId
										? <h2>Team members</h2>
										: null
									}
								</div>
							}
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}