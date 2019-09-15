import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import ReactSVG from 'react-svg'

export default class Button extends Component {
	render() {
		let className = `button ${this.props.className || ''} 
		button-${this.props.size || 'md'} 
		button-${this.props.colour || 'black'} 
		button-${this.props.isHollow ? 'hollow' : 'solid'}`;

		let leftIcon = this.props.leftIcon
			? <ReactSVG className="button-icon" src={this.props.leftIcon} />
			: null;

		let label = this.props.label
			? <span className="button-label">{this.props.label}</span>
			: null;

		let rightIcon = this.props.rightIcon
			? <ReactSVG className="button-icon" src={this.props.rightIcon} />
			: null;

		return this.props.to
			? <Link className={className} to={this.props.to}>{leftIcon}{label}{rightIcon}</Link>
			: <button className={className} type={this.props.type || "button"} onClick={this.props.onClick}>{leftIcon}{label}{rightIcon}</button>
	}
}