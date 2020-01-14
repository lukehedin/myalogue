import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import group_default from './group_default.jpg';

export default class GroupAvatar extends Component {
	render() {
		let className = "group-avatar";
		let size = this.props.size || 64;
		let style = {
			width: size,
			height: size,
			minWidth: size,
			minHeight: size,
			backgroundSize: 'contain'	
		};
		
		style.backgroundImage = `url('${this.props.group.avatarUrl ? this.props.group.avatarUrl : group_default}')`;

		return this.props.to
			? <Link className={className} style={style} to={this.props.to}></Link>
			: <div className={className} style={style}></div>
	}
}