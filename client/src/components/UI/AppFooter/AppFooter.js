import React, { Component } from 'react';
import Util from '../../../Util';

import logo from '../../../images/logo_white.png';

export default class AppFooter extends Component {
	constructor(props) {
		super(props);
	}
	render() {
		return <footer className="app-footer">
			<div className="container">
				<div className="row"> 
					<div className="app-footer-inner">
						<img src={logo} className="app-logo" alt="logo" />
						<div className="flex-spacer"></div>
						<h4>Created by <a target="_blank" href="https://www.instagram.com/imdoodlir/">imdoodlir</a></h4>
					</div>
				</div>
			</div>
		</footer>
	}
}