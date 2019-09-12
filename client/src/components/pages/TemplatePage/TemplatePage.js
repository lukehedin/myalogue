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
			template: null
		};
	}
	componentDidMount() {
		Util.api.post('/api/getTemplate', {
			templateId: this.props.templateId
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					template: result
				});
			}
			
			this.setState({
				isLoading: false
			});
		});
	}
	render() {
		if(this.state.isLoading) return <div className="loader"></div>;
		if(!this.state.template) return <div className="page-error">Template not found.</div>;

		return <div className="page-template">
			<div className="container">
				<div className="row">
					<h2>{this.state.template.name}</h2>
					<Comic template={this.state.template} />
				</div>
			</div>
		</div>;
	}
}