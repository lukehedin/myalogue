import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import logo from '../../../images/logo_white.png';
import Util from '../../../Util';

export default class AppFooter extends Component {
	render() {
		return <footer className="app-footer">
			<div className="container">
				<div className="row"> 
					<div className="app-footer-inner">
						<img src={logo} className="app-logo" alt="logo" />
						<div className="flex-spacer"></div>
						<div>
							<h6>Created by <a target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/imdoodlir/">imdoodlir</a></h6>
							<h6>© 2019 Speak4Yourself (S4YCOMIC)</h6>
							<h6><Link to={Util.route.termsOfService()}>Terms of Service</Link> | <Link to={Util.route.privacyPolicy()}>Privacy Policy</Link></h6>
						</div>
					</div>
				</div>
			</div>
		</footer>
	}
}