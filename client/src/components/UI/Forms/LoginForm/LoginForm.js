import React, { Component } from 'react';
import validator from 'validator';

import asForm from '../asForm';

import Button from '../../Button/Button';

class LoginForm extends Component {
	render() {
		return <form onSubmit={this.props.submitForm}>
			{this.props.getField('emailUsername')}
			{this.props.getField('password')}
			<div className="button-container">
				<Button type="submit" label="Login" />
			</div>
		</form>
	}
}

export default asForm(LoginForm, {
	fields: {
		emailUsername: {
			label: 'Email or username',
			getError: (val) => {
				if(!validator.isLength(val, { min: 3, max: 255 })) return 'Please enter a valid username or email (3-255 characters)';
			}
		},
		password: {
			label: 'Password',
			isPassword: true
		}
	}
})