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
			<h2>Login</h2>
			{this.state.isSubmitted
				? <div>
					<h3>Please verify your email address</h3>
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
						if(result.error) {
							form.setOverallError(result.error);
						} else {
							console.log(result);
						}
					});
				}} />
			}
			<h4>Already have an acount? <Link to={Util.route.register()}>Login</Link></h4>
		</div>;
	}
}