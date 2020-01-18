import React, { Component } from 'react';
import Util from '../../../Util';
import { Redirect } from 'react-router-dom';

import TemplateNavigation from '../../UI/TemplateNavigation/TemplateNavigation';
import ComicList from '../../UI/ComicList/ComicList';
import Button from '../../UI/Button/Button';
import Comic from '../../UI/Comic/Comic';
import PlayButton from '../../UI/PlayButton/PlayButton';

export default class TemplatePage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true, //if true, loading comics but not the template itself
			template: null,

			topComic: null
		};

		this.fetchTimeout = null;
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
			topComic: null,
			isLoading: true
		});

		if(this.fetchTimeout) clearTimeout(this.fetchTimeout);
		this.fetchTimeout = setTimeout(() => {
			Util.api.post('/api/getTopComic', { templateId: templateId})
				.then(topComic => {
					//If the template is still the same, continue on
					if(topComic.templateId === this.state.template.templateId) {
						if(topComic) this.setState({ topComic: topComic });
						this.setState({
							isLoading: false
						});
					}
				})
		}, 700);
	}
	render() {
		if(!this.state.template) return null;
		
		return <div className="page-template">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<TemplateNavigation toFn={Util.route.template} template={this.state.template} />
						<h2 className="page-title template-name">{this.state.template.name}</h2>
						<div className="play-template button-container">
							<PlayButton templateId={this.state.templateId} />
						</div>
						<div className="top-comic-container">
							{this.state.isLoading
								? <div className="loader"></div>
								: this.state.topComic 
									? <div>
										<h3>Top comic with this template</h3>
										<div className="comic-wrapper">
											<Comic comic={this.state.topComic} />
										</div>
									</div>
									: <p className="empty-text">No comics have been made using this template yet.</p>
							}
						</div>
						{this.state.isLoading || !this.state.topComic
							? null
							: <div>
								<ComicList
									title={'More comics with this template'}
									sortBy={Util.enums.ComicSortBy.TopAll}
									ignoreComicIds={[this.state.topComic.comicId]}
									templateId={this.state.template.templateId}
								/>
							</div>
						}
					</div>
				</div>
			</div>
		</div>;
	}
}