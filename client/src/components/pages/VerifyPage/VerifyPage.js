import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import RegisterForm from '../../UI/Forms/RegisterForm/RegisterForm';
import Button from '../../UI/Button/Button';

export default class VerifyPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true
		};
	}
	componentDidMount() {
		Util.api.post('/api/verifyAccount', {
			token: this.props.token
		})
		.then((result) => {
			if(!result.error) {
				Util.context.set(result);
				window.location.href = Util.route.home();
			} else {
				this.setState({
					isLoading: false
				});
			}
		});
	}
	render() {
		return <div className="page-verify">
			{this.state.isLoading
				? <div className="loader"></div>
				: <div className="container">
					<div className="row">
						<div className="verify-message">
							<h2>Sorry, something went wrong.</h2>
							<p>Could not verify account.</p>
							<Button to={Util.route.home()} colour="pink" size="lg" label="Back to home" />
						</div>
					</div>
				</div>
			}
		</div>;
	}
}