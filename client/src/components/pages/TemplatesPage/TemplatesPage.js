import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import TabbedPanels from '../../UI/TabbedPanels/TabbedPanels';

export default class TemplatesPage extends Component {
	render() {
		return <div className="page-templates">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h1 className="page-title">Templates</h1>
						<p className="page-subtitle"><span>Each template has it's own unique set of comic panels. </span>{Util.context.isAuthenticated() ? <span><Link to={Util.route.profile(Util.context.getUserId(), 'templates')}>View your profile</Link> to see how often you've used each template.</span> : <span><Link to={Util.route.register()}>Create an account</Link> to see how often you've used each template.</span>}</p>
						<div className="templates">
							<ul>
								{[...Util.context.getTemplates()]
									.reverse()
									.map(template => <li key={template.templateId}>{template.templateId} - <Link to={Util.route.template(template.templateId)}>{template.name}</Link></li>)}
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}