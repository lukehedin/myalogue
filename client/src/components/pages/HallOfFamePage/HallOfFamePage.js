import React, { Component } from 'react';
import Util from '../../../Util';
import { Redirect } from 'react-router-dom';

import Comic from '../../UI/Comic/Comic';
import TemplateNavigation from '../../UI/TemplateNavigation/TemplateNavigation';

export default class HallOfFamePage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			
			comics: [],
			viewingTemplateId: null
		};
	}
	componentDidMount() {
		Util.api.post('/api/getHallOfFameComics')
			.then(result => {
				if(!result.error) {
					this.setState({
						comics: result
					});
				}
				
				this.setState({
					isLoading: false
				});

				this.setViewingTemplateId();
			});
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.templateId !== prevProps.templateId;
	}
	componentDidUpdate(prevProps, prevState, isNewTemplateId) {
		if(isNewTemplateId) this.setViewingTemplateId(); //a new templateId
	}
	setViewingTemplateId() {
		this.setState({
			viewingTemplateId: parseInt(this.props.templateId, 10)
		});
	}
	render() {
		let viewingTemplate = Util.context.getTemplateById(this.state.viewingTemplateId);
		let viewingComic = Util.array.any(this.state.comics)
			? this.state.comics.find(comic => comic.templateId === this.state.viewingTemplateId)
			: null;

		return <div className="page-hall-of-fame">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h2>Hall of Fame</h2>
						<p>The highest rated comics for each template make it into the Hall of Fame. If your comic is rated higher than one of these comics, you'll steal their place!</p>
						<TemplateNavigation toFn={Util.route.hallOfFame} templateId={this.state.viewingTemplateId} />
					</div>
				</div>
			</div>
			{this.state.isLoading
				? null
				: <div className="panel-inset">
					<div className="container">
						<div className="row">
							{!viewingComic
								? <p className="empty-text">No one has made a comic using this template. If you make the first one, you'll (at least temporarily) be in the Hall of Fame!</p>
								: null
							}
							{viewingTemplate
								? <Comic key={this.state.viewingTemplateId} template={viewingTemplate.templateId} comic={viewingComic} />
								: null
							}
						</div>
					</div>
				</div>
			}
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						{this.state.isLoading 
							? <div className="loader"></div>
							: <div className="hall-of-fame-list">
								{this.state.comics.map(comic => {
									return <table className="hall-of-fame-list-item">
										{/* {} todo comic.title, template.id, username etc */}
									</table>
								})}
							</div>
						}
					</div>
				</div>
			</div>
		</div>;
	}
}