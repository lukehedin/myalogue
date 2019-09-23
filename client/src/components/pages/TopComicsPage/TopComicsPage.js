import React, { Component } from 'react';
import Util from '../../../Util';
import { Redirect } from 'react-router-dom';

import Comic from '../../UI/Comic/Comic';
import TemplateNavigation from '../../UI/TemplateNavigation/TemplateNavigation';
import Button from '../../UI/Button/Button';
import ComicTitle from '../../UI/ComicTitle/ComicTitle';

export default class TopComicsPage extends Component {
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
						<table className="hall-of-fame-table">
							<tbody>
								{Util.context.getTopComics().map(comic => {
									let template = Util.context.getTemplateById(comic.templateId);
									return <tr key={comic.templateId} className="hall-of-fame-list-item">
										<td>
											<p className="sm"><b>Template {comic.templateId}</b>: <ComicTitle comic={comic} /> ({comic.rating})</p>
											<p className="sm">{template.description}</p>
										</td>
										<td className="cell-button">
											<Button to={Util.route.template(comic.templateId)} label="View" colour="black" />
										</td>
									</tr>
								})}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>;
	}
}