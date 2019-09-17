import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import ReactSVG from 'react-svg';
import Util from '../../../Util';

import logo from '../../../images/logo_white.png';

import Button from '../Button/Button';
import ContextMenu from '../ContextMenu/ContextMenu';

export default class AppHeader extends Component {
	constructor(props) {
		super(props);

		this.onLogout = this.onLogout.bind(this);
	}
	onLogout() {
		Util.context.clear();
	}
	render() {
		return <header className="app-header">
			<div className="container">
				<div className="row"> 
					<div className="app-header-inner">
						<ContextMenu className="app-menu" menuItems={[{
							label: 'Home',
							to: Util.route.home()
						}, {
							label: 'Hall of Fame',
							to: Util.route.hallOfFame()
						}, {
							label: 'About',
							to: Util.route.about()
						}]}>
							<ReactSVG className="app-menu-icon" src={Util.icon.menu} />
						</ContextMenu>
						<Link to={Util.route.home()}><img src={logo} className="app-logo" alt="logo" /></Link>
						<div className="flex-spacer"></div>
						{Util.context.isAuthenticated()
							? <div className="button-container">
								<span>{Util.context.getUsername()}</span>
								<Button size="sm" onClick={this.onLogout} colour="white" isHollow={true} label="Log out" />
							</div>
							: <div className="button-container">
								<Button size="sm" colour="white" isHollow={true} to={Util.route.login()} label="Log in" />
								<Button size="sm" colour="pink" to={Util.route.register()} label="Register" />
							</div>
						}
					</div>
				</div>
			</div>
		</header>
	}
}