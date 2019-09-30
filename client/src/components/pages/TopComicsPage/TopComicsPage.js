import React, { Component } from 'react';
import Util from '../../../Util';

import Button from '../../UI/Button/Button';
import ComicPanelAuthorList from '../../UI/ComicPanelAuthorList/ComicPanelAuthorList';

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
		return <div className="page-top-comics">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h1>Top comics</h1>
						<p className="page-subtitle center">The highest rated comics for each template.</p>
					</div>
				</div>
			</div>
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<div className="top-comics-inner">
							{this.state.isLoading
								? <div className="loader"></div>
								: Util.array.any(this.state.topComics)
									? <table className="top-comics-table">
										<tbody>
											{Util.context.getTemplates().map(template => {
												let topComic = this.state.topComics.find(comic => comic.templateId === template.templateId);
												return <tr key={template.templateId} className="top-comics-list-item">
													<td>
														<p className="sm"><b>Template {template.templateId}</b></p>
														<p className="sm">{template.name}</p>
														{topComic ? <p className="sm">Comic #{topComic.comicId} (Rating: {topComic.rating}) by <ComicPanelAuthorList comic={topComic} />.</p> : null}
													</td>
													{topComic
														? <td className="cell-button">
															<div className="button-container">
																<Button to={Util.route.comic(topComic.comicId)} label="View comic" colour="pink" />
															</div>
														</td>
														: <td></td>
													}
												</tr>
											})}
										</tbody>
									</table>
								: <p className="empty-text align-center">No top comics to show.</p>
							}
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}