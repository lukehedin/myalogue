import React, { Component } from 'react';
import Util from '../../../Util';

import AvatarSelector from '../../UI/AvatarSelector/AvatarSelector';
import ChangePasswordForm from '../../UI/Forms/ChangePasswordForm/ChangePasswordForm';

//this.props.userId
export default class ProfilePage extends Component {
	render() {
		return <div className="page-settings">
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<h1 className="page-title">Settings</h1>
					</div>
				</div>
			</div>
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<div className="settings-row">
							<h2>Change avatar</h2>
							<AvatarSelector />
						</div>
						<hr />
						<div className="settings-row">
							<h2>Change password</h2>
							<ChangePasswordForm onSubmit={(form, formData) => {
								form.setLoading(true);

								Util.api.post('/api/changePassword', {
									currentPassword: formData.currentPassword,
									newPassword: formData.newPassword
								})
								.then(result => {
									if(!result.error) {
										form.setFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
										form.setOverallMessage('Your password was changed.');
									} else {
										form.setOverallError(result.error);
									}
									form.setLoading(false);
								});
							}} />
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}