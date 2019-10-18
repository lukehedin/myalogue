import React, { Component } from 'react';
import Util from '../../../Util';

import Button from '../../UI/Button/Button';

export default class Error404Page extends Component {
	render() {
		return <div className="page-error-404">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h1 className="page-title">Page not found</h1>
						<p className="page-subtitle">Sorry, the page requested wasn't found. The link may be old or broken.</p>
						<div className="button-container justify-center">
							<Button to={Util.route.home()} size="md" colour="black" label="Back to home" />
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}