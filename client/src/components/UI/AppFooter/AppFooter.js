import React, { Component } from 'react';
import Util from '../../../Util';

import logo from '../../../logo.svg';

export default class AppFooter extends Component {
	constructor(props) {
		super(props);
	}
	render() {
		return <header className="app-footer">
			<img src={logo} className="app-logo" alt="logo" />
			<h1 className="app-title">Myalogue</h1>
			<div>Created by <a href="https://www.instagram.com/imdoodlir/">imdoodlir</a></div>
		</header>
	}
}