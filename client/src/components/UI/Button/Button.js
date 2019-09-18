import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import ReactSVG from 'react-svg'
import Util from '../../../Util';

export default class Button extends Component {
	constructor(props){
		super(props);

		this.onClick = this.onClick.bind(this);
	}
	onClick(e) {
		if(this.props.onClick) this.props.onClick(e);
	}
	render() {
		let className = `button ${this.props.className || ''} 
			button-${this.props.size || 'md'} 
			button-${this.props.colour || 'black'} 
			button-${this.props.isHollow ? 'hollow' : 'solid'}`;

		let getIcon = (path) => {
			if(!path) return null;

			return !this.props.isIconNotSvg
				? <ReactSVG className="button-icon" src={path} />
				: <img alt="" className="button-icon" src={path} />
		};

		let leftIcon = getIcon(this.props.leftIcon);
		let rightIcon = getIcon(this.props.rightIcon);

		let label = this.props.label
			? <span className="button-label">{this.props.label}</span>
			: null;

		return this.props.to
			? <Link className={className} onClick={this.onClick} to={this.props.to}>{leftIcon}{label}{rightIcon}</Link>
			: this.props.href
				? <a className={className} onClick={this.onClick} href={this.props.href} download={this.props.download}>{leftIcon}{label}{rightIcon}</a>
				: <button className={className} tabIndex={this.props.tabIndex} type={this.props.type || "button"} onClick={this.onClick}>{leftIcon}{label}{rightIcon}</button>
	}
}