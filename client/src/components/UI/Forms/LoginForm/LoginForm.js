import React, { Component } from 'react';
import validator from 'validator';

import asForm from '../asForm';

import Button from '../../Button/Button';

class LoginForm extends Component {
	render() {
		return <form onSubmit={this.props.submitForm}>
			{this.props.getField('email')}
			{this.props.getField('password')}
			<div className="button-container">
				<Button type="submit" label="Login" />
			</div>
		</form>
	}
}

export default asForm(LoginForm, {
	fields: {
		email: {
			label: 'Email',
			getError: (val) => {
				if(!validator.isEmail(val)) return 'Please enter a valid email: yourname@example.com';
			}
		},
		password: {
			label: 'Password',
			isPassword: true
		}
	}
})