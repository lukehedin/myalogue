import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import Util from '../../../Util';

import Button from '../../UI/Button/Button';
import GroupEditorForm from '../../UI/Forms/GroupEditorForm/GroupEditorForm';
import ImageUpload from '../../UI/ImageUpload/ImageUpload';
import GroupAvatar from '../../UI/GroupAvatar/GroupAvatar';

export default class GroupEditorPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: !!this.props.groupId,

			group: null
		};

		this.updateAvatarUrl = this.updateAvatarUrl.bind(this);
	}
	componentDidMount() {
		if(this.props.groupId) this.fetchGroup();
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
	updateAvatarUrl(url) {
		this.setState({
			group: {
				...this.state.group,
				avatarUrl: url
			}
		});
	}
	render() {
		if(!Util.context.isAuthenticated()) return <Redirect to={Util.route.register()} />;

		let isEditing = this.props.groupId || (this.state.group && this.state.group.groupId);

		return <div className="page-group-editor">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h1 className="page-title">{isEditing ? 'Edit group' : 'Create group'}</h1>
						<div className="group-editor">
							{this.state.isLoading
								? <div className="loader"></div>
								: <div className="group-editor-inner">
									{isEditing
										? <div className="group-avatar-editor">
											<GroupAvatar group={this.state.group} size={96} />
											<ImageUpload endpoint='/api/uploadGroupAvatar' params={{ groupId: this.state.group.groupId }} onUploaded={(url) => this.updateAvatarUrl(url)} />
										</div>
										: null
									}
									<GroupEditorForm 
										formData={this.state.group || { isPublic: true }}
										onSubmit={(form, formData) => {
											form.setLoading(true);

											Util.api.post('/api/saveGroup', {
												group: formData
											})
											.then(result => {
												if(!result.error) {
													this.setState({
														group: result
													});
	
													form.setFormData(result);
												} else {
													form.setOverallError(result.error);
												}

												form.setLoading(false);
											});
										}}
									/>
								</div>
							}
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}