import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Button from '../Button/Button';
import Util from '../../../Util';
import ReactSVG from 'react-svg';

export default class ContextMenu extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isMenuVisible: false
		};

		this.toggleIsMenuVisible = this.toggleIsMenuVisible.bind(this);
	}
	componentWillUnmount() {
		window.removeEventListener('click', this.toggleIsMenuVisible);
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

			if(isMenuVisible && this.props.onShow) this.props.onShow(); 
		}, 50);
	}
	render() {
		return <div className={`context-menu ${this.props.className || ''}`}>
			<div className="menu-toggle" onClick={this.toggleIsMenuVisible}>
				{this.props.children || <Button leftIcon={Util.icon.contextMenu} size="sm" colour="transparent" isHollow={true} />}
			</div>
			<div className={`context-menu-content ${this.props.alignHorizontal || 'left'} ${this.props.alignVertical || 'bottom'} ${this.state.isMenuVisible ? 'open' : ''}`}>
				{this.props.content}
				{this.props.menuItems
					? <div className="menu-items">
						{this.props.menuItems.map((menuItem, idx) => {
							let menuItemInner = <div className="menu-item-inner">
								{menuItem.icon && <ReactSVG className="modal-close-icon" src={menuItem.icon} />}
								<span>{menuItem.label}</span>
							</div>;

							if(menuItem.to) return <Link key={idx} className="menu-item" to={menuItem.to}>{menuItemInner}</Link>
							if(menuItem.link) return <a href={menuItem.link} target="_blank" rel="noopener noreferrer" key={idx} className="menu-item">{menuItemInner}</a>
							return <div key={idx} className="menu-item" onClick={menuItem.onClick}>{menuItemInner}</div>
						})}
					</div>
					: null
				}
			</div>
		</div>
	}
}