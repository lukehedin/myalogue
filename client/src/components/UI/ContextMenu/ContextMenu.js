import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

export default class ContextMenu extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isMenuVisible: false
		};

		this.toggleIsMenuVisible = this.toggleIsMenuVisible.bind(this);
	}
	toggleIsMenuVisible(e) {
		let isMenuVisible = !this.state.isMenuVisible;

		if(isMenuVisible) {
			window.addEventListener('click', this.toggleIsMenuVisible);
		} else {
			window.removeEventListener('click', this.toggleIsMenuVisible);
		}

		//Prevents immediate close
		setTimeout(() => {
			this.setState({
				isMenuVisible
			});
		}, 50);
	}
	render() {
		return <div className={`context-menu ${this.props.className || ''} ${this.props.align || 'left'}`}>
			<div className="menu-toggle" onClick={this.toggleIsMenuVisible}>
				{this.props.children}
			</div>
			<div className={`menu-items ${this.state.isMenuVisible ? 'open' : ''}`}>
				{this.props.menuItems.map((menuItem, idx) => {
					return menuItem.to
						? <Link key={idx} className="menu-item" to={menuItem.to}>{menuItem.label}</Link>
						: <div key={idx} className="menu-item" onClick={menuItem.onClick}>{menuItem.label}</div>
				})}
			</div>
		</div>
	}
}