import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import ReactSVG from 'react-svg'

export default class Button extends Component {
	render() {
		let className = `button ${this.props.className || ''} button-${this.props.size || 'md'} button-${this.props.colour || 'black'} button-${this.props.isHollow ? 'hollow' : 'solid'}`;

		let label = this.props.label
			? <span>{this.props.label}</span>
			: null;

		let icon = this.props.icon
			? <ReactSVG className="button-icon" src={this.props.icon} />
			: null;

		return this.props.to
			? <Link className={className} to={this.props.to}>{icon}{label}</Link>
			: <button className={className} type={this.props.type || "button"} onClick={this.props.onClick}>{icon}{label}</button>
	}
}