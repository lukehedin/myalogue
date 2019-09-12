import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import logo from '../../../images/logo_white.png';

import Button from '../Button/Button';

export default class AppHeader extends Component {
	constructor(props) {
		super(props);

		this.onLogout = this.onLogout.bind(this);
	}
	onLogout() {
		Util.auth.logout();
	}
	render() {
		return <header className="app-header">
			<div className="container">
				<div className="row"> 
					<div className="app-header-inner">
						<Link to={Util.route.home()}><img src={logo} className="app-logo" alt="logo" /></Link>
						<div className="flex-spacer"></div>
						{Util.auth.getUserId()
							? <div>{Util.auth.getUsername()} (<a onClick={this.onLogout}>Log out</a>)</div>
							: <div className="auth-buttons">
								<Button to={Util.route.login()} label="Log in" />
								<Button to={Util.route.register()} label="Register" />
							</div>
						}
					</div>
				</div>
			</div>
		</header>
	}
}