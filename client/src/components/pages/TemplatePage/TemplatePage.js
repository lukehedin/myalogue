import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import Comic from '../../UI/Comic/Comic';
import Dropdown from '../../UI/Dropdown/Dropdown'
import Button from '../../UI/Button/Button';

export default class TemplatePage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			template: null,
			comics: [],
			comicOrderBy: 1
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
				
				Util.api.post('/api/getComics', {
					templateId: result.templateId
				})
				.then(result => {
					if(!result.error) {
						this.setState({
							comics: result
						});
					}
				})
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
					<h2>{this.state.template.name}</h2>
					{/* <Button label="Next template" /> */}
				</div>
				<div className="template-feed">
					<Comic template={this.state.template} />
					<h2>Comics created with this template:</h2>
					<div className="field-container">
						<label>Order by</label>
						<Dropdown displayProp='label' valueProp='type' options={[
						{
							type: 1,
							label: 'Top Rated'
						}, {
							type: 2,
							label: 'Newest'
						}, {
							type: 3,
							label: 'Random'
						}
						]} />
					</div>
					{this.state.comics.map(comic => {
						return <Comic key={comic.comicId} template={this.state.template} comic={comic} />
					})}
				</div>
			</div>
		</div>;
	}
}