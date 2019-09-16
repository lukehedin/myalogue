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
		this.setTemplate(this.props.templateId, this.props.comicId);
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.templateId !== prevProps.templateId
			? this.props.templateId
			: null;
	}
	componentDidUpdate(prevProps, prevState, snapshot) {
		if(snapshot) this.setTemplate(snapshot); //a new templateId
	}
	setComic(comic) {
		this.setState({
			comic: comic
		});
	}
	setTemplate(templateId, comicId) {
		this.setState({
			templateId: templateId ? parseInt(templateId, 10) : null,
			comic: null,
			isLoading: true
		});
		
		let fetchPromises = [Util.api.post('/api/getTemplate', {
			templateId: templateId
		})];

		if(comicId) {
			fetchPromises.push(Util.api.post('/api/getComic', {
				comicId: comicId
			}));
		}

		Promise.all(fetchPromises)
			.then(([templateResult, comicResult]) => {
				if(!templateResult.error) {
					this.setState({
						templateId: templateResult.templateId,
						template: templateResult,
					});
				}
				
				if(comicResult && !comicResult.error && comicResult.templateId === templateResult.templateId) {
					this.setState({
						comic: comicResult
					});
				}
				
				this.setState({
					isLoading: false
				});
			});
	}
	render() {
		if(!this.state.isLoading && !this.state.template) return <Redirect to={Util.route.home()} />;

		return <div className="page-template">
			<div className="container">
				<div className="row">
					{this.state.templateId ? <TemplateNavigation className="top-template-nav" templateId={this.state.templateId} /> : null }
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
									<Comic template={this.state.template} comic={this.state.comic} isCallToActionVisible={!!this.state.comic} />
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
								<h4>{this.state.comic ? 'Other comics' : 'Comics'} created with this template</h4>
								<ComicList sortBy={this.state.comic ? Util.enum.ComicSortBy.Random : Util.enum.ComicSortBy.TopRated} template={this.state.template} />
							</div>
							: <div className="loader"></div>
						}
					</div>
				</div>
			</div>
			<div className="container">
				<div className="row">
					{!this.state.isLoading //Don't show bottom one until loaded
						? <TemplateNavigation className="bottom-template-nav" templateId={this.state.templateId} /> 
						: null
					}
				</div>
			</div>
		</div>;
	}
}