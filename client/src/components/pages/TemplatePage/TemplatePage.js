import React, { Component } from 'react';
import Util from '../../../Util';
import { Redirect } from 'react-router-dom';

import Comic from '../../UI/Comic/Comic';
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
	componentDidMount() {
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
			template: template
		});
	}
	render() {
		if(!this.state.isLoading && !this.state.template) return <Redirect to={Util.route.home()} />;

		return <div className="page-template">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						{this.state.templateId ? <TemplateNavigation toFn={Util.route.template} templateId={this.state.templateId} /> : null }
					</div>
				</div>
			</div>
			<div className="panel-inset panel-template-feed">
				<div className="container">
					<div className="row">
						{!this.state.isLoading
							? <div className="template-feed">
								<TemplateNavigation toFn={Util.route.template} templateId={this.state.templateId} />
								<ComicList
									emptyText={`No other comics have been made using this template.`}
									noMoreText={`Phew! That's all the comics that have been made using this template.`}
									fetchDelay={700} //Prevent fast nav spamming
									sortBy={this.state.comic 
										? Util.enum.ComicSortBy.Random 
										: Util.enum.ComicSortBy.TopRated
									}
									templateId={this.state.template.templateId}
								/>
							</div>
							: <div className="loader"></div>
						}
					</div>
				</div>
			</div>
		</div>;
	}
}