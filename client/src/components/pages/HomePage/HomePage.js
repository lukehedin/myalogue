import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import S4YButton from '../../UI/S4YButton/S4YButton';

export default class HomePage extends Component {
	render() {
		return <div className="page-login">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h2>Speak 4 Yourself</h2>
						<p>A game that allows you to put your own dialogue into the panel of a comic, changing the plot and interactions between characters.</p>
						<S4YButton size="lg" />
					</div>
				</div>
			</div>
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<h3>Recent Games</h3>
					</div>
				</div>
			</div>
		</div>;
	}
}