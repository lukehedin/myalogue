import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

export default class TemplatesPage extends Component {
	render() {
		return <div className="page-templates">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h1 className="page-title">Templates</h1>
						<div className="templates">
							{[...Util.referenceData.getTemplates()].reverse().map(template => {
								return <ul>
									<li>{template.templateId} - <Link to={Util.route.template(template.templateId)}>{template.name}</Link></li>
								</ul>
							})}
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}