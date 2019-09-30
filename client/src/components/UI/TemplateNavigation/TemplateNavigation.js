import React, { Component } from 'react';
import Util from '../../../Util';

import Button from '../Button/Button';

export default class TemplateNavigation extends Component {
	render() {
		let templateId = this.props.template.templateId;
		let latestTemplateId = Util.context.getLatestTemplateId();
		
		return <div className={`template-navigation ${this.props.className || ''}`}>
			<div className="button-container">
				<Button 
					to={this.props.toFn(1)} 
					size="sm"
					className={templateId > 1 ? '' : 'disabled invisible'} 
					label="First"
					leftIcon={Util.icon.first}
				/>
				<Button 
					to={this.props.toFn(templateId - 1)} 
					size="sm"
					className={templateId > 1 ? '' : 'disabled invisible'} 
					label="Previous" 
					leftIcon={Util.icon.back}
				/>
			</div>
			<div className="template-info">
				<h2>{templateId}</h2>
			</div>
			<div className="button-container">
				<Button 
					to={this.props.toFn(templateId + 1)} 
					size="sm"
					className={templateId !== latestTemplateId ? '' : 'disabled invisible'}
					label="Next"
					rightIcon={Util.icon.next}
				/>
				<Button 
					to={this.props.toFn(latestTemplateId)} 
					size="sm"
					className={templateId !== latestTemplateId ? '' : 'disabled invisible'}
					label="Latest" 
					rightIcon={Util.icon.last}
				/>
			</div>
		</div>;
	}
}