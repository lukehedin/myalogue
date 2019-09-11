import React, { Component } from 'react';
import Util from '../../../../Util';
import validator from 'validator';

import withForm from '../withForm';

import Button from '../../Button/Button';

class RegisterForm extends Component {
	render() {
		return <form onSubmit={this.props.submitForm}>
			{this.props.getField('email')}
			{this.props.getField('username')}
			{this.props.getField('password')}
			{this.props.getField('confirmPassword')}
			<Button type="submit" label="Register" />
		</form>
	}
}

export default withForm(RegisterForm, {
	fields: {
		email: {
			label: 'Email',
			getError: (val) => {
				if(!validator.isEmail(val)) return 'Enter a valid email';
			}
		},
		username: {
			label: 'Username',
			getError: (val) => {
				if(!validator.isLength(val, { min: 3 })) return 'Enter a valid username (minimum 3 characters)';
			}
		},
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