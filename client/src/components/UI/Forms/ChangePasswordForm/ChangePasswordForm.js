import React, { Component } from 'react';
import validator from 'validator';

import asForm from '../asForm';

import Button from '../../Button/Button';

class ChangePasswordForm extends Component {
	render() {
		return <form onSubmit={this.props.submitForm}>
			<h2>Change password</h2>
			{this.props.getField('currentPassword')}
			{this.props.getField('newPassword')}
			{this.props.getField('confirmNewPassword')}
			<div className="button-container">
				<Button size="md" colour="pink" label="Save password" type="submit" />
			</div>
		</form>
	}
}

export default asForm(ChangePasswordForm, {
	class: 'auth-form',
	fields: {
		currentPassword: {
			label: 'Current password',
			isPassword: true
		},
		newPassword: {
			label: 'New password',
			isPassword: true,
			getError: (val) => {
				if(!validator.isLength(val, { min: 8 })) return 'Password too short (minimum 8 characters)';
				if(!validator.isLength(val, { max: 127 })) return 'Password too long (maximum 127 characters)';
			}
		},
		confirmNewPassword: {
			label: 'Confirm new password',
			isPassword: true,
			getError: (val, formData) => {
				if(val !== formData.newPassword) return 'Passwords do not match';
			}
		}
	}
})