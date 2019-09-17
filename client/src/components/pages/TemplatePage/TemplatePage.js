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
			templateId: null,
			template: null,

			comic: null, //viewing comic for template (via link)

			comics: [], // comics using template
			comicOrderBy: 1,
			comicLimit: 3,
			comicSkip: 0
		};

		this.setComic = this.setComic.bind(this);
	}
	componentDidMount() {
		this.setTemplate();
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.templateId !== prevProps.templateId;
	}
	componentDidUpdate(prevProps, prevState, isNewTemplateId) {
		if(isNewTemplateId) this.setTemplate(); //a new templateId
	}
	setComic(comic) {
		this.setState({
			comic: comic
		});
	}
	setTemplate() {
		let templateId = this.props.templateId ? parseInt(this.props.templateId, 10) : null;
		let comicId = this.props.comicId ? parseInt(this.props.comicId, 10) : null;

		let template = templateId 
			? Util.context.getTemplateById(templateId) 
			: Util.context.getLatestTemplate();
		
		this.setState({
			templateId: templateId,
			template: template,
			comic: null,
			isLoading: !!comicId
		});
		
		if(comicId) {
			Util.api.post('/api/getComic', {
				comicId: comicId
			})
			.then(result => {
				if(result && !result.error && result.templateId === this.state.templateId) {
					this.setState({
						comic: result
					});
				}
				
				this.setState({
					isLoading: false
				});
			});
		}
	}
	render() {
		if(!this.state.isLoading && !this.state.template) return <Redirect to={Util.route.home()} />;

		return <div className="page-template">
			<div className="container">
				<div className="row">
					{this.state.templateId ? <TemplateNavigation templateId={this.state.templateId} /> : null }
				</div>
			</div>
			{!this.state.isLoading 
				? <div className="template-highlight">
					<div className="container">
						<div className="row">
							<div className="template-highlight-inner">
								<div>
									{this.props.comicId && !this.state.comic 
										? <p className="empty-text">The bad news is that the requested comic no longer exists. The good news is that you can make a new one right now!</p>
										: null
									}
									<Comic template={this.state.template} comic={this.state.comic} />
								</div>
							</div>
						</div>
					</div>
				</div>
				: null
			}
			<div className="template-feed">
				<div className="container">
					<div className="row">
						{!this.state.isLoading
							? <div className="template-feed-inner">
								<TemplateNavigation templateId={this.state.templateId} /> 
								<ComicList
									fetchDelay={1000} //Prevent fast nav spamming
									sortBy={this.state.comic ? Util.enum.ComicSortBy.Random : Util.enum.ComicSortBy.TopRated} 
									template={this.state.template}
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