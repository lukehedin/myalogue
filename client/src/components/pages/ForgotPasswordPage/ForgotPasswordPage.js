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
						{/* NOAUTH: Disable forgot pw page */}
						<div>
							<p>{Util.authNotSupportedMessage}</p>
							<p className="form-message"><Link to={Util.route.home()}>Take me home</Link></p>
						</div>;
						{/* {this.state.isSubmitted
							? <div>
								<p className="page-subtitle">An email has been sent to you with instructions on how to reset your password.</p>
								<div className="button-container">
									<Button label="Back to home" to={Util.route.home()} colour="black" size="md" />
								</div>
							</div>
							: <div>
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
						} */}
					</div>
				</div>
			</div>
		</div>;
	}
}