import React, { Component } from 'react';
import Util from '../../../Util';

import Button from '../../UI/Button/Button';

export default class Error404Page extends Component {
	componentDidMount() {
		//TODO Analytics track
	}
	render() {
		return <div className="page-error-404">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h2>Page not found</h2>
						<p className="center">Sorry, the page requested wasn't found. The link may be old or broken.</p>
						<div className="button-container">
							<Button to={Util.route.home()} size="lg" colour="pink" label="Back to home" />
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}