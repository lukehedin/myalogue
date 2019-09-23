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
							label: 'Play',
							to: Util.route.play()
						}, {
							label: 'Top comics',
							to: Util.route.topComics()
						}, {
							label: 'About',
							to: Util.route.about()
						}]}>
							<ReactSVG className="app-menu-icon" src={Util.icon.menu} />
						</ContextMenu>
						<Link to={Util.route.home()}><img src={logo} className="app-logo" alt="logo" /></Link>
						<div className="flex-spacer"></div>
						
						{Util.context.isAuthenticated()
							? <ContextMenu align="right" className="app-menu" menuItems={[{
								label: 'Profile',
								to: Util.route.profile()
							}, {
								label: 'Log out',
								onClick: this.onLogout
							}]}>
								<Button size="sm" className="user-name-button" label={Util.context.getUsername()} isHollow={true} colour="white" />
							</ContextMenu>
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