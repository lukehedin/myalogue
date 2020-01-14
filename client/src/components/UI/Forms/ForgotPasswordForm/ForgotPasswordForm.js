import React, { Component } from 'react';
import validator from 'validator';

import asForm from '../asForm';

import Button from '../../Button/Button';

class ForgotPasswordForm extends Component {
	render() {
		return <form onSubmit={this.props.submitForm}>
			<h2>Forgot password</h2>
			<p className="form-message">Please provide the email address or username associated with your account. You'll receive an email with instructions on how to set a new password.</p>
			{this.props.getField('emailUsername')}
			<div className="button-container justify-center">
				<Button size="lg" colour="pink" label="Submit" type="submit" />
			</div>
		</form>
	}
}

export default asForm(ForgotPasswordForm, {
	class: 'auth-form',
	fields: {
		emailUsername: {
			label: 'Email or username',
			getError: (val) => {
				if(!validator.isLength(val, { min: 3, max: 255 })) return 'Please enter a valid username or email (3-255 characters)';
			}
		}
	}
})