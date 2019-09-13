import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import Comic from '../../UI/Comic/Comic';
import Dropdown from '../../UI/Dropdown/Dropdown'
import Button from '../../UI/Button/Button';
import ComicList from '../../UI/ComicList/ComicList';

export default class TemplatePage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			template: null,

			comics: [],
			comicOrderBy: 1,
			comicLimit: 3,
			comicSkip: 0
		};
	}
	componentDidMount() {
		Util.api.post('/api/getTemplate', {
			templateId: this.props.templateId
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					template: result,
					isLoading: false
				});
			}
		})
	}
	render() {
		if(this.state.isLoading) return <div className="loader"></div>;
		if(!this.state.template) return <div className="page-error">Template not found.</div>;

		return <div className="page-template">
			<div className="container">
				<div className="template-header">
					{/* <Button label="Previous template" /> */}
					<h5>Current template</h5>
					<h3>#{this.state.template.ordinal} - {this.state.template.name}</h3>
					{/* <Button label="Next template" /> */}
				</div>
				<div className="template-feed">
					<Comic template={this.state.template} />
					<h5>Comics created with this template:</h5>
					<ComicList template={this.state.template} />
				</div>
			</div>
		</div>;
	}
}