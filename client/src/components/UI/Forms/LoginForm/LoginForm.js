import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import validator from 'validator';
import Util from '../../../../Util';

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
			<div className="form-message">
				<p>Forgot your password? <Link to={Util.route.forgotPassword()}>Reset password</Link></p>
				<p>Don't have an acount? <Link to={Util.route.register()}>Register</Link></p>
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