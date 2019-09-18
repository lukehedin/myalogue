import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

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
						<h2>Register</h2>
						{this.state.isSubmitted
							? <div>
								<h2>Please verify your email address</h2>
								<p>You will receive an email with a verification link.</p>
							</div>
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
						<p className="center">Already have an account? <Link to={Util.route.login()}>Log in</Link></p>
					</div>
				</div>
			</div>
		</div>;
	}
}