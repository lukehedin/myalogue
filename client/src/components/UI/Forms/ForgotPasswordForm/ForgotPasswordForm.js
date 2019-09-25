import React, { Component } from 'react';
import Util from '../../../../Util';
import validator from 'validator';
import { Link } from 'react-router-dom';

import asForm from '../asForm';

import Button from '../../Button/Button';

class ForgotPasswordForm extends Component {
	render() {
		return <form onSubmit={this.props.submitForm}>
			{this.props.getField('email')}
			<div className="button-container justify-center">
				<Button colour="pink" label="Submit" type="submit" />
			</div>
		</form>
	}
}

export default asForm(ForgotPasswordForm, {
	fields: {
		email: {
			label: 'Email',
			getError: (val) => {
				if(!validator.isEmail(val)) return 'Please enter a valid email: yourname@example.com';
			}
		}
	}
})