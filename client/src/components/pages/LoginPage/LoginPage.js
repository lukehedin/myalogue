import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import Util from '../../../Util';

import LoginForm from '../../UI/Forms/LoginForm/LoginForm';

export default class LoginPage extends Component {
	render() {
		return <div className="page-login">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h2>Login</h2>
						<LoginForm onSubmit={(form, formData) => {
							form.setLoading(true);
							
							Util.api.post('/api/login', {
								email: formData.email,
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
					</div>
				</div>
			</div>
		</div>;
	}
}