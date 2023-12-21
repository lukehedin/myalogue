import React, { Component } from 'react';
import Util from '../../../Util';

import SetPasswordForm from '../../UI/Forms/SetPasswordForm/SetPasswordForm';

export default class SetPasswordPage extends Component {
	render() {
		return <div className="page-set-password">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						{/* NOAUTH: Disable set pw page */}
						<div>
							<p>{Util.authNotSupportedMessage}</p>
							<p className="form-message"><Link to={Util.route.home()}>Take me home</Link></p>
						</div>;
						{/* <SetPasswordForm onSubmit={(form, formData) => {
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
						}} /> */}
					</div>
				</div>
			</div>
		</div>;
	}
}