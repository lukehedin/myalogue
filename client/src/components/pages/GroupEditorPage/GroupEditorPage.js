import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import Util from '../../../Util';

import Button from '../../UI/Button/Button';
import GroupEditorForm from '../../UI/Forms/GroupEditorForm/GroupEditorForm';

export default class GroupEditorPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: !!this.props.groupId,

			group: null
		}
	}
	componentDidMount() {
		if(this.props.groupId) this.fetchGroup();
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.groupId !== prevProps.groupId;
	}
	componentDidUpdate(prevProps, prevState, isNewProps) {
		if(isNewProps) {
			this.setState({
				isLoading: true
			}, this.fetchGroup);
		}
	}
	fetchGroup() {
		Util.api.post('/api/getGroup', {
			groupId: this.props.groupId
		})
		.then(group => {
			this.setState({
				isLoading: false,
				group
			});
		})
	}
	render() {
		if(!Util.context.isAuthenticated()) return <Redirect to={Util.route.register()} />;

		return <div className="page-group-editor">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h1 className="page-title">{this.props.groupId ? 'Manage group' : 'Create group'}</h1>
						<div className="group-editor">
							{this.state.isLoading
								? <div className="loader"></div>
								: <div className="group-editor-inner">
									<GroupEditorForm 
										formData={this.state.group || {}}
										onSubmit={(form, formData) => {
											form.setLoading(true);

											Util.api.post('/api/saveGroup', {
												group: formData
											})
											.then(updatedGroup => {
												this.setState({
													group: updatedGroup
												});
												
												form.setLoading(false);
											});
										}}
									/>
									{this.state.group && this.state.group.groupId
										? <h2>Group members</h2>
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