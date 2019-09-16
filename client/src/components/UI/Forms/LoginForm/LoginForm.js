import React, { Component } from 'react';
import Util from '../../../../Util';
import validator from 'validator';

import withForm from '../withForm';

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

export default withForm(LoginForm, {
	fields: {
		email: {
			label: 'Email',
			getError: (val) => {
				if(!validator.isEmail(val) || !validator.isLength(val, { min: 1 })) return 'Please enter a valid email: yourname@example.com';
			}
		},
		password: {
			label: 'Password',
			isPassword: true
		}
	}
})