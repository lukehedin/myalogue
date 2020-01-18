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
		window.addEventListener('focus', this.fetchNewNotifications);
	}
	componentWillUnmount() {
		clearInterval(this.notificationInterval);
		window.removeEventListener('focus', this.fetchNewNotifications);
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

					//Sometimes the same a notification with an existing usernotificationid will be returned. eg. a new comment. we need to replace it.
					let newNotifications = result;
					let updatedNotifications = this.state.notifications.map(existingNotification => {
						let matchingNewNotification = newNotifications.find(newNotification => newNotification.userNotificationId === existingNotification.userNotificationId);
						if(matchingNewNotification) {
							//A new notification matches an existing one's id. Remove it from new notifications and put it into existing.
							newNotifications = newNotifications.filter(newNotification => newNotification.userNotificationId !== matchingNewNotification.userNotificationId);
							return matchingNewNotification;
						} else {
							return existingNotification;
						}
					});

					this.setNotifications([
						...newNotifications,
						...updatedNotifications
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
					let link = null;

					if(notification.comicId) {
						link = Util.route.comic(notification.comicId);
					} else if (notification.groupId) {
						link = Util.route.group(notification.groupId);
					} if(notification.type === Util.enums.NotificationType.AchievementUnlocked) {
						link = Util.route.withQueryParams(Util.route.profile(Util.context.getUsername()), { tabId: 'achievements' })
					} else if (notification.type === Util.enums.NotificationType.GroupInviteReceived) {
						link = Util.route.withQueryParams(Util.route.groups(), { tabId: 'requests' });
					}

					let className = `notification ${notification.isActionable ? 'actionable' : ''} ${link ? 'linked' : ''}`;
					
					return <div key={notification.userNotificationId} onClick={() => this.actionedNotification(notification)} className={className}>
						{notification.title ? <p className="title">{notification.title}</p> : null}
						<p className="message">{notification.message}</p>
						<p className="date">{moment(notification.createdAt).fromNow()}</p>
						{link ? <Link className="link" to={link}></Link> : null}
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