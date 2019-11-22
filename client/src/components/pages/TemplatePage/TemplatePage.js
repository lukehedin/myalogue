import React, { Component } from 'react';
import Util from '../../../Util';
import { Redirect } from 'react-router-dom';

import TemplateNavigation from '../../UI/TemplateNavigation/TemplateNavigation';
import ComicList from '../../UI/ComicList/ComicList';
import Button from '../../UI/Button/Button';

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
			? Util.referenceData.getTemplateById(templateId) 
			: Util.referenceData.getLatestTemplate();
		
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
						<h1 className="page-title">{this.state.template.name}</h1>
						<div className="play-template button-container justify-center">
							<Button label="Play with this template" colour="pink" to={Util.route.play(this.state.template.templateId)} />
						</div>
						<hr />
						<ComicList
							sortBy={Util.enums.ComicSortBy.TopAll}
							fetchDelay={700} //Prevent fast nav spamming
							templateId={this.state.template.templateId}
						/>
					</div>
				</div>
			</div>
		</div>;
	}
}