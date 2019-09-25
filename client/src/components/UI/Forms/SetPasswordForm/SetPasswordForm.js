import React, { Component } from 'react';
import Util from '../../../../Util';
import validator from 'validator';
import { Link } from 'react-router-dom';

import asForm from '../asForm';

import Button from '../../Button/Button';

class SetPasswordForm extends Component {
	render() {
		return <form onSubmit={this.props.submitForm}>
			{this.props.getField('password')}
			{this.props.getField('confirmPassword')}
			<div className="button-container justify-center">
				<Button colour="pink" label="Save" type="submit" />
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