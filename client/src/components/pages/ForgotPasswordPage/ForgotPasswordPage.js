import React, { Component } from 'react';
import Util from '../../../Util';

import Button from '../../UI/Button/Button';
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
						<h1 className="page-title">Forgot password</h1>
						{this.state.isSubmitted
							? <div>
								<p className="page-subtitle">An email has been sent to you with instructions on how to reset your password.</p>
								<div className="button-container justify-center">
									<Button label="Back to home" to={Util.route.home()} colour="black" size="md" />
								</div>
							</div>
							: <div>
								<p className="page-subtitle">Please provide the email address or username associated with your account. You'll receive an email with instructions on how to set a new password.</p>
								<ForgotPasswordForm onSubmit={(form, formData) => {
									Util.api.post('/api/forgotPassword', {
										emailUsername: formData.emailUsername
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