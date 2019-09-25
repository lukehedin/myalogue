import React, { Component } from 'react';
import Util from '../../../Util';
import { Redirect } from 'react-router-dom';

import Comic from '../../UI/Comic/Comic';
import TemplateNavigation from '../../UI/TemplateNavigation/TemplateNavigation';
import Button from '../../UI/Button/Button';
import ComicTitle from '../../UI/ComicTitle/ComicTitle';

export default class TopComicsPage extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true,
			topComics: []
		}
	}
	componentDidMount() {
		Util.api.post('/api/getTopComics')
			.then(result => {
				if(!result.error) {
					this.setState({
						topComics: result
					});
				}

				this.setState({
					isLoading: false
				})
			});
	}
	render() {
		return <div className="page-hall-of-fame">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h2>Top comics</h2>
						<p className="page-subtitle center sm">The highest rated comics for each template. If you make a better comic for a template, it will appear in this list and at the top of it's template page.</p>
					</div>
				</div>
			</div>
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						{this.state.isLoading
							? <div className="loader"></div>
							: Util.array.any(this.state.topComics)
								? <table className="hall-of-fame-table">
									<tbody>
										{this.state.topComics.map(comic => {
											let template = Util.context.getTemplateById(comic.templateId);
											return <tr key={comic.templateId} className="hall-of-fame-list-item">
												<td>
													<p className="sm"><b>Template {comic.templateId}</b>: Comic #{comic.comicId} ({comic.rating})</p>
													<p className="sm">{template.description}</p>
												</td>
												<td className="cell-button">
													<Button to={Util.route.template(comic.templateId)} label="View" colour="black" />
												</td>
											</tr>
										})}
									</tbody>
								</table>
							: <p className="empty-text align-center">No top comics to show.</p>
						}
					</div>
				</div>
			</div>
		</div>;
	}
}