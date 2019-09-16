import React, { Component } from 'react';
import Util from '../../../Util';

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
	componentWillReceiveProps(props) {
		if(props.templateId !== this.props.templateId) {
			this.setTemplate(props.templateId)
		}
	}
	setComic(comic) {
		this.setState({
			comic: comic
		});
	}
	setTemplate(templateId, comicId) {
		this.setState({
			templateId: templateId ? parseInt(templateId) : null,
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
				
				if(comicResult && !comicResult.error) {
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
		return <div className="page-template">
			<div className="container">
				<div className="row">
					{this.state.templateId ? <TemplateNavigation templateId={this.state.templateId} /> : null }
					<div className="template-feed">
						{this.state.isLoading
							? <div className="loader"></div>
							: this.state.template
								? <div className="template-feed-inner">
									<Comic template={this.state.template} comic={this.state.comic} isCallToActionVisible={!!this.state.comic} />
									<h5>{this.state.comic ? 'Other comics' : 'Comics'} created with this template</h5>
									<ComicList sortBy={this.state.comic ? Util.enum.ComicSortBy.Random : Util.enum.ComicSortBy.TopRated} template={this.state.template} />
								</div>
								: <p className="empty-text">Template not found.</p>
						}
					</div>
					{this.state.templateId && !this.state.isLoading ? <TemplateNavigation templateId={this.state.templateId} /> : null }
				</div>
			</div>
		</div>;
	}
}