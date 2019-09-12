import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import RegisterForm from '../../UI/Forms/RegisterForm/RegisterForm';
import Comic from '../../UI/Comic/Comic';

export default class TemplatePage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			template: null,
			comics: []
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
				<Comic template={this.state.template} />
				<div className="template-feed">
					<h2>Comics created with this template:</h2>
					{this.state.comics.map(comic => {
						return <Comic template={this.state.template} comic={comic} />
					})}
				</div>
			</div>
		</div>;
	}
}