import React, { Component } from 'react';
import Util from '../../../Util';
import { Redirect } from 'react-router-dom';

import TemplateNavigation from '../../UI/TemplateNavigation/TemplateNavigation';
import ComicList from '../../UI/ComicList/ComicList';

export default class TemplatePage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			template: null
		};
	}
	componentDidMount(){
		this.setTemplate();
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.templateId !== prevProps.templateId;
	}
	componentDidUpdate(prevProps, prevState, isNewTemplateId) {
		if(isNewTemplateId) this.setTemplate();
	}
	setTemplate() {
		let templateId = this.props.templateId ? parseInt(this.props.templateId, 10) : null;

		let template = templateId 
			? Util.context.getTemplateById(templateId) 
			: Util.context.getLatestTemplate();
		
		this.setState({
			templateId: templateId,
			template: template,
			isLoading: false
		});
	}
	render() {
		if(this.state.isLoading) return null;
		if(!this.state.template) return <Redirect to={Util.route.home()} />;
		
		return <div className="page-template">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<TemplateNavigation toFn={Util.route.template} template={this.state.template} />
						<h3 className="template-name">{this.state.template.name}</h3>
						<div className="template-feed">
							<ComicList
								emptyText={`No comics have been completed using this template yet.`}
								noMoreText={`Phew! That's all the comics that have been completed using this template.`}
								fetchDelay={700} //Prevent fast nav spamming
								templateId={this.state.template.templateId}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}