import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import ReactSVG from 'react-svg';
import Util from '../../../Util';

import logo from '../../../images/logo_header.png';

import Avatar from '../Avatar/Avatar';
import Button from '../Button/Button';
import ContextMenu from '../ContextMenu/ContextMenu';
import NotificationMenu from '../NotificationMenu/NotificationMenu';

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
							label: 'Templates',
							to: Util.route.templates()
						}, {
							label: 'Teams',
							to: Util.route.teams()
						}, {
							label: 'Leaderboards',
							to: Util.route.leaderboards()
						}, {
							label: 'How to play',
							to: Util.route.howToPlay()
						}, {
							label: 'About',
							to: Util.route.about()
						}]}>
							<ReactSVG className="app-menu-icon" src={Util.icon.menu} />
						</ContextMenu>
						<Link to={Util.route.home()}><img src={logo} className="app-logo" alt="logo" /></Link>
						<div className="flex-spacer"></div>
						{Util.context.isAuthenticated()
							? <NotificationMenu />
							: null
						}
						{Util.context.isAuthenticated()
							? <ContextMenu align="right" className="profile-menu" 
								content={<p className="username sm center">{Util.context.getUsername()}</p>}
								menuItems={[{
									label: 'My profile',
									to: Util.route.profile()
								}, {
									label: 'Settings',
									to: Util.route.settings()
								}, {
									label: 'Log out',
									onClick: this.onLogout
								}]}
							>
								<Avatar size={32} />
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