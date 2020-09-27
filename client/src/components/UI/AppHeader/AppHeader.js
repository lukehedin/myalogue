import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import ReactSVG from 'react-svg';
import Util from '../../../Util';

import logo from '../../../images/logo_header.png';

import Button from '../Button/Button';
import ContextMenu from '../ContextMenu/ContextMenu';
import NotificationMenu from '../NotificationMenu/NotificationMenu';
import UserAvatar from '../UserAvatar/UserAvatar';
import Search from '../Search/Search';

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
							label: 'Leaderboards',
							to: Util.route.leaderboards()
						}, {
							label: 'Templates',
							to: Util.route.templates()
						}, {
							label: 'Achievements',
							to: Util.route.achievements()
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
						<Search />
						<div className="flex-spacer"></div>
						{Util.context.isAuthenticated()
							? <NotificationMenu />
							: null
						}
						{Util.context.isAuthenticated()
							? <ContextMenu alignHorizontal="right" className="profile-menu" 
								content={<p className="username sm center">{Util.context.getUsername()}</p>}
								menuItems={[{
									label: 'Profile',
									to: Util.route.profile()
								}, {
									label: 'Groups',
									to: Util.route.groups()
								}, {
									label: 'Settings',
									to: Util.route.settings()
								}, {
									label: 'Log out',
									onClick: this.onLogout
								}]}
							>
								<UserAvatar size={32} />
							</ContextMenu>
							: <Button size="sm" colour="white" isHollow={true} to={Util.route.login()} label="Login" />
						}
					</div>
				</div>
			</div>
		</header>
	}
}