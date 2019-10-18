import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import Button from '../../UI/Button/Button';
import RegisterForm from '../../UI/Forms/RegisterForm/RegisterForm';

export default class RegisterPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isSubmitted: false
		};
	}
	render() {
		return <div className="page-register">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h1 className="page-title">{this.state.isSubmitted ? 'Verify your account' : 'Create an account'}</h1>
						{this.state.isSubmitted
							? <p className="center">You will receive an email with a link to verify your account. You may need to check your junk inbox.</p>
							: <RegisterForm onSubmit={(form, formData) => {
								form.setLoading(true);
								
								Util.api.post('/api/register', {
									email: formData.email,
									username: formData.username,
									password: formData.password
								})
								.then((result) => {
									form.setLoading(false);
									if(!result.error) {
										this.setState({
											isSubmitted: true
										});
									} else {
										form.setOverallError(result.error);
									}
								});
							}} />
						}
						{this.state.isSubmitted
							? <div className="button-container justify-center">
								<Button label="Back to home" to={Util.route.home()} colour="black" size="md" />
							</div>
							: <p className="center">Already have an account? <Link to={Util.route.login()}>Log in</Link></p>
						}
					</div>
				</div>
			</div>
		</div>;
	}
}