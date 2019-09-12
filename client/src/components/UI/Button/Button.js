import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export default class Button extends Component {
	render() {
		let className = `button ${this.props.className || ''}`;

		return this.props.to
			? <Link className={className} to={this.props.to}>{this.props.label}</Link>
			: <button className={className} type={this.props.type || "button"} onClick={this.props.onClick}>{this.props.label}</button>
	}
}