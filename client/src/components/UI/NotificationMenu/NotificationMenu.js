import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';
import moment from 'moment';

import Button from '../Button/Button';
import ContextMenu from '../ContextMenu/ContextMenu';

export default class NotificationButton extends Component {
	constructor(props) {
		super(props);

		this.state = {
			notifications: [],
			lastCheckedAt: null
		};

		this.notificationInterval = null;
		
		this.fetchNewNotifications = this.fetchNewNotifications.bind(this);
		this.seenNotifications = this.seenNotifications.bind(this);
		this.actionedNotification = this.actionedNotification.bind(this);
		this.setNotifications = this.setNotifications.bind(this);
	}
	componentDidMount() {
		this.fetchNewNotifications();
		this.notificationInterval = setInterval(this.fetchNewNotifications, 20000);
	}
	componentWillUnmount() {
		clearInterval(this.notificationInterval);
	}
	setNotifications(notifications) {
		//Sets state AND updates window/tab title with (3) 
		this.setState({
			notifications
		});

		let unseenNotifications = notifications.filter(notification => !notification.isSeen);

		//Cleans existing notifications in title if any
		let baseTitle = document.title.includes('(')
			? document.title.substring(0, document.title.indexOf('(') - 1)
			: document.title;

		Util.array.any(unseenNotifications)
			? document.title = baseTitle + ` (${unseenNotifications.length})`
			: document.title = baseTitle;
	}
	fetchNewNotifications() {
		if(Util.context.isAuthenticated()) {
			Util.api.post('/api/getNotifications', {
				lastCheckedAt: this.state.lastCheckedAt
			})
			.then(result => {
				if(!result.error) {
					this.setState({
						lastCheckedAt: new Date()
					});

					//Small chance we did our first fetch, returned a notification created in the last window
					//And then on the update fetch got it again. This filters out any repeats.
					let existingUserNotificationIds = this.state.notifications.map(n => n.userNotificationId);
					let newNotifications = result.filter(newNotification => !existingUserNotificationIds.includes(newNotification.userNotificationId));

					this.setNotifications([
						...newNotifications,
						...this.state.notifications
					]);
				}
			});
		}
	}
	seenNotifications() {
		let unseenUserNotificationIds = this.state.notifications
			.filter(notification => !notification.isSeen)
			.map(notification => notification.userNotificationId);

		if(Util.array.any(unseenUserNotificationIds)) {
			//Server update
			Util.api.post('/api/seenNotifications', {
				userNotificationIds: unseenUserNotificationIds
			});
			//Client update
			this.setNotifications(this.state.notifications.map(notification => {
				return {
					...notification,
					isSeen: true
				};
			}));
		}
	}
	actionedNotification(actionedNotification) {
		if(actionedNotification.isActionable) {
			//Server update
			Util.api.post('/api/actionedUserNotification', {
				userNotificationId: actionedNotification.userNotificationId
			});
			//Client update
			this.setNotifications(this.state.notifications.map(notification => {
				return notification.userNotificationId === actionedNotification.userNotificationId
					? {
						...notification,
						isActionable: false
					}
					: notification;
			}));
		}
	}
	render() {
		let notifications = this.state.notifications.sort((n1, n2) => new Date(n2.createdAt) - new Date(n1.createdAt));
		let unseenNotifications = notifications.filter(notification => !notification.isSeen);

		let content = <div className="notification-content">
			{Util.array.any(notifications)
				? notifications.map(notification => {
					let link = notification.comicId ? Util.route.comic(notification.comicId) : null;

					let className = `notification ${notification.isActionable ? 'actionable' : ''} ${link ? 'linked' : ''}`;
					
					return <div key={notification.userNotificationId} onClick={() => this.actionedNotification(notification)} className={className}>
						{link ? <Link className="link" to={link}></Link> : null}
						<p className="title">{notification.title}</p>
						<p className="message">{notification.message}</p>
						<p className="date">{moment(notification.createdAt).fromNow()}</p>
					</div>
				})
				: <p className="empty-text align-center">You have no notifications.</p>}
		</div>;

		return <ContextMenu align="right" className="notification-menu" content={content} onShow={this.seenNotifications}>
			<Button className="notification-button" 
			size="sm"
			label={Util.array.any(unseenNotifications) ? unseenNotifications.length.toString() : null} 
			leftIcon={Util.icon.bell}
			isHollow={Util.array.none(unseenNotifications)} 
			colour={Util.array.none(unseenNotifications) ? 'white' : 'pink'}
		/>
		</ContextMenu>;
	}
}