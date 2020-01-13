import React, { Component } from 'react';
import validator from 'validator';

import asForm from '../asForm';

import Button from '../../Button/Button';

class SetPasswordForm extends Component {
	render() {
		return <form className="auth-form" onSubmit={this.props.submitForm}>
			<h2 className="page-title">Set new password</h2>
			<p className="form-message">Enter a new password for your account.</p>
			{this.props.getField('password')}
			{this.props.getField('confirmPassword')}
			<div className="button-container justify-center">
				<Button size="lg" colour="pink" label="Save password" type="submit" />
			</div>
		</form>
	}
}

export default asForm(SetPasswordForm, {
	fields: {
		password: {
			label: 'Password',
			isPassword: true,
			getError: (val) => {
				if(!validator.isLength(val, { min: 8 })) return 'Password too short (minimum 8 characters)';
				if(!validator.isLength(val, { max: 127 })) return 'Password too long (maximum 127 characters)';
			}
		},
		confirmPassword: {
			label: 'Confirm password',
			isPassword: true,
			getError: (val, formData) => {
				if(val !== formData.password) return 'Passwords do not match';
			}
		}
	}
})