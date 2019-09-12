import React, { Component } from 'react';
import Util from '../../../Util';

import logo from '../../../images/logo_white.png';

export default class AppFooter extends Component {
	constructor(props) {
		super(props);
	}
	render() {
		return <header className="app-footer">
			<img src={logo} className="app-logo" alt="logo" />
			<h1 className="app-title">Speak 4 Yourself</h1>
			<div>Created by <a href="https://www.instagram.com/imdoodlir/">imdoodlir</a></div>
		</header>
	}
}