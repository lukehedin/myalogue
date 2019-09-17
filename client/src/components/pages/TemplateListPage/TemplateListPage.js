import React, { Component } from 'react';
import Util from '../../../Util';
import { Redirect } from 'react-router-dom';

export default class TemplatePage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			templates: []
		};
	}
	componentDidMount() {
		Util.api.post('/api/getAllTemplates')
			.then(templates => {
				if(!templateResult.error) {
					this.setState({
						templates: templates,
					});
				}
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
								<ComicList 
									key={this.state.template.templateId} 
									fetchDelay={300} 
									sortBy={this.state.comic ? Util.enum.ComicSortBy.Random : Util.enum.ComicSortBy.TopRated} 
									template={this.state.template}
								/>
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