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
			<Button type="submit" label="Login" />
		</form>
	}
}

export default withForm(LoginForm, {
	fields: {
		email: {
			label: 'Email',
			getError: (val) => {
				if(!validator.isEmail(val) || !validator.isLength(val, { min: 1 })) return 'Enter a valid email';
			}
		},
		password: {
			label: 'Password',
			isPassword: true,
			getError: (val) => {
				if(!validator.isLength(val, { min:8 })) return 'Password too short (minimum 8 characters)';
				if(!validator.isLength(val, { max: 127 })) return 'Password too long (maximum 127 characters)';
			}
		}
	}
})