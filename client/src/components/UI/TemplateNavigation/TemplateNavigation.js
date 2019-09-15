import React, { Component } from 'react';
import Util from '../../../Util';

import Button from '../../UI/Button/Button';

export default class TemplateNavigation extends Component {
	render() {
		return <div className="template-navigation">
			<div className="button-container">
				<Button 
					to={Util.route.template(1)} 
					className={this.props.ordinal > 1 ? '' : 'disabled invisible'} 
					label="First"
					leftIcon={Util.icon.first}
				/>
				<Button 
					to={Util.route.template(this.props.ordinal - 1)} 
					className={this.props.ordinal > 1 ? '' : 'disabled invisible'} 
					label="Previous" 
					leftIcon={Util.icon.back}
				/>
			</div>
			<div className="flex-spacer"></div>
			<div>
				<h5>Template</h5>
				<h3>#{this.props.ordinal}</h3> 
			</div>
			<div className="flex-spacer"></div>
			<div className="button-container">
				<Button 
					to={Util.route.template(this.props.ordinal + 1)} 
					label="Next"
					rightIcon={Util.icon.next}
				/>
				<Button 
					to={Util.route.template()} 
					label="Latest" 
					rightIcon={Util.icon.last}
				/>
			</div>
		</div>;
	}
}