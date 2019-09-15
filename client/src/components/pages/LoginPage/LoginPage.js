import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import Util from '../../../Util';

import LoginForm from '../../UI/Forms/LoginForm/LoginForm';

export default class LoginPage extends Component {
	render() {
		if(Util.auth.isAuthenticated()) return <Redirect to={Util.route.home()} />

		return <div className="page-login">
			<h2>Login</h2>
			<LoginForm onSubmit={(form, formData) => {
				form.setLoading(true);
				
				Util.api.post('/api/login', {
					email: formData.email,
					password: formData.password
				})
				.then((result) => {
					if(!result.error) {
						Util.auth.set(result);
						window.location.href = Util.route.home();
					} else {
						form.setLoading(false);
						form.setOverallError(result.error);
					}
				});
			}} />
			<h4><Link to={Util.route.register()}>Don't have an acount? Register</Link></h4>
			<h4><Link to={Util.route.forgotPassword()}>Forgot your password?</Link></h4>
		</div>;
	}
}