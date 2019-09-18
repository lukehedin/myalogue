import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import Util from '../../../Util';

import ForgotPasswordForm from '../../UI/Forms/ForgotPasswordForm/ForgotPasswordForm';

export default class ForgotPasswordPage extends Component {
	constructor(props){
		super(props);

		this.state = {
			isSubmitted: false
		};
	}
	setIsSubmitted(isSubmitted) {
		this.setState({
			isSubmitted: true
		});
	}
	render() {
		return <div className="page-forgot-password">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h2>Forgot password</h2>
						{this.state.isSubmitted
							? <p>An email has been sent to you with instructions on how to reset your password.</p>
							: <div>
								<p>Please provide the email associated with your account and you'll get an email with instructions on how to set a new password.</p>
								<ForgotPasswordForm onSubmit={(form, formData) => {
									Util.api.post('/api/forgotPassword', {
										email: formData.email
									});

									//Immediate
									this.setState({
										isSubmitted: true
									});
								}} />
							</div>
						}
					</div>
				</div>
			</div>
		</div>;
	}
}