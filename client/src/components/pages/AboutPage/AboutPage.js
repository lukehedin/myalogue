import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import Util from '../../../Util';

export default class AboutPage extends Component {
	render() {
		return <div className="page-about">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<div>SVG Icons made by <a target="_blank" rel="noopener noreferrer" href="https://www.flaticon.com/authors/gregor-cresnar" title="Gregor Cresnar">Gregor Cresnar</a> from <a target="_blank" rel="noopener noreferrer" href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
					</div>
				</div>
			</div>
		</div>;
	}
}