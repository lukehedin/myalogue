import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import validator from 'validator';
import Util from '../../../../Util';

import asForm from '../asForm';

import Button from '../../Button/Button';

class RegisterForm extends Component {
	render() {
		return <form onSubmit={this.props.submitForm}>
			{this.props.getField('email')}
			<p className="form-message">Your email is only used to verify and manage your account.</p>
			{this.props.getField('username')}
			{this.props.getField('password')} 
			{this.props.getField('confirmPassword')}
			<p className="form-message">By creating an account you confirm you are 13 years old or older and agree to the <Link to={Util.route.termsOfService()}>Terms of Service</Link> and <Link to={Util.route.privacyPolicy()}>Privacy Policy</Link>.</p>
			<div className="button-container justify-center">
				<Button type="submit" colour="pink" size="lg" label="Create account" />
			</div>
		</form>
	}
}

export default asForm(RegisterForm, {
	fields: {
		email: {
			label: 'Email', 
			getError: (val) => {
				if(!validator.isEmail(val)) return 'Please enter a valid email eg. yourname@example.com';
			}
		},
		username: {
			label: 'Username',
			getError: (val) => {
				if(!validator.isLength(val, { min: 3 })) return 'Please enter a longer username (minimum 3 characters)';
				if(!validator.isAlphanumeric(val)) return 'Username can only contain letters and numbers';
				if(!validator.isLength(val, { max: 20 })) return 'Please enter a shorter username (maximum 20 characters)';
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