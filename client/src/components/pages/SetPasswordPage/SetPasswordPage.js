import React, { Component } from 'react';
import Util from '../../../Util';

import SetPasswordForm from '../../UI/Forms/SetPasswordForm/SetPasswordForm';

export default class SetPasswordPage extends Component {
	render() {
		return <div className="page-about">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h2>Set new password</h2>
						<p>Enter a new password for your account.</p>
						<SetPasswordForm onSubmit={(form, formData) => {
							form.setLoading(true);

							Util.api.post('/api/setPassword', {
								password: formData.password,
								token: this.props.token
							})
							.then(result => {
								if(!result.error) {
									Util.context.set(result);
									window.location.href = Util.route.home();
								} else {
									form.setOverallError(result.error);
									form.setLoading(false);
								}
							});
						}} />
					</div>
				</div>
			</div>
		</div>;
	}
}