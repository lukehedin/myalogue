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
			ordinal: null,
			template: null,

			comics: [],
			comicOrderBy: 1,
			comicLimit: 3,
			comicSkip: 0
		};
	}
	componentDidMount() {
		this.setTemplate(this.props.ordinal);
	}
	componentWillReceiveProps(props) {
		if(props.ordinal !== this.props.ordinal) {
			this.setTemplate(props.ordinal)
		}
	}
	setTemplate(ordinal) {
		this.setState({
			ordinal: ordinal ? parseInt(ordinal) : null,
			isLoading: true
		});
		
		Util.api.post('/api/getTemplate', {
			ordinal: ordinal
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					ordinal: result.ordinal,
					template: result,
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
					{this.state.ordinal ? <TemplateNavigation ordinal={this.state.ordinal} /> : null }
					<div className="template-feed">
						{this.state.isLoading
							? <div className="loader"></div>
							: this.state.template
								? <div className="template-feed-inner">
									<Comic template={this.state.template} />
									<h5>Comics created with this template</h5>
									<ComicList template={this.state.template} />
								</div>
								: <p className="empty-text">Template not found.</p>
						}
					</div>
					{this.state.ordinal && !this.state.isLoading ? <TemplateNavigation ordinal={this.state.ordinal} /> : null }
				</div>
			</div>
		</div>;
	}
}