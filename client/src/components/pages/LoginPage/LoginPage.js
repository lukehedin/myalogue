import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import LoginForm from '../../UI/Forms/LoginForm/LoginForm';

export default class LoginPage extends Component {
	render() {
		return <div className="page-login">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h1 className="page-title">Login</h1>
						<LoginForm onSubmit={(form, formData) => {
							form.setLoading(true);
							
							Util.api.post('/api/login', {
								emailUsername: formData.emailUsername,
								password: formData.password
							})
							.then((result) => {
								if(!result.error) {
									Util.context.set(result);
									window.location.href = Util.route.home();
								} else {
									form.setLoading(false);
									form.setOverallError(result.error);
								}
							});
						}} />
						<p className="center">Forgot your password? <Link to={Util.route.forgotPassword()}>Forgot password</Link></p>
						<p className="center">Don't have an account? <Link to={Util.route.register()}>Register</Link></p>
					</div>
				</div>
			</div>
		</div>;
	}
}