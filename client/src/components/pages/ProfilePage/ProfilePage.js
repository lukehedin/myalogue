import React, { Component } from 'react';
import Util from '../../../Util';

export default class ProfilePage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			comics: []
		};
	}
	render() {
		return <div className="page-profile">
			<div className="container">
				<div className="row">
					<h2>Profile</h2>
				</div>
			</div>
		</div>;
	}
}