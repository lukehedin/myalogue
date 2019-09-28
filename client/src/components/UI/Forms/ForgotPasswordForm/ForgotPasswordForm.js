import React, { Component } from 'react';
import validator from 'validator';

import asForm from '../asForm';

import Button from '../../Button/Button';

class ForgotPasswordForm extends Component {
	render() {
		return <form onSubmit={this.props.submitForm}>
			{this.props.getField('emailUsername')}
			<div className="button-container justify-center">
				<Button colour="pink" label="Submit" type="submit" />
			</div>
		</form>
	}
}

export default asForm(ForgotPasswordForm, {
	fields: {
		emailUsername: {
			label: 'Email or username',
			getError: (val) => {
				if(!validator.isLength(val, { min: 3, max: 255 })) return 'Please enter a valid username or email (3-255 characters)';
			}
		}
	}
})