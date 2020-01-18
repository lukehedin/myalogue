import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openModal } from '../../../redux/actions';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Util from '../../../Util';

import GroupAvatar from '../GroupAvatar/GroupAvatar';
import ContextMenu from '../ContextMenu/ContextMenu';

class GroupPendingInfoUser extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,

			groupRequests: null,
			groupInvites: null
		};

		this.acceptGroupInvite = this.acceptGroupInvite.bind(this);
		this.ignoreGroupInvite = this.ignoreGroupInvite.bind(this);
	}
	componentDidMount() {
		Util.api.post('/api/getPendingGroupInfoForUser')
			.then(groupInfo => {
				this.setState({
					isLoading: false,

					groupRequests: groupInfo.groupRequests,
					groupInvites: groupInfo.groupInvites
				});
			});
	}
	ignoreGroupInvite(groupInvite) {
		this.props.openModal({
			type: Util.enums.ModalType.Confirm,
			title: 'Ignore invite',
			content: <div>
				<p className="center">Are you sure you want to ignore the invite to <b>{groupInvite.group.name}</b>?</p>
				<p className="center">You won't be able to receive another invite to the group for a while.</p>
			</div>,
			yesLabel: 'Yes, ignore',
			noLabel: 'Cancel',
			yesFn: () => {
				//Server
				Util.api.post('/api/actionGroupInvite', {
					groupInviteId: groupInvite.groupInviteId,
					isAccepting: false
				});
				//Client (remove invite)
				this.setState({
					groupInvites: this.state.groupInvites.filter(gi => gi.groupInviteId !== groupInvite.groupInviteId)
				});
			}
		});
	}
	acceptGroupInvite(groupInvite) {
		//Server
		Util.api.post('/api/actionGroupInvite', {
			groupInviteId: groupInvite.groupInviteId,
			isAccepting: true
		})
		.then(result => {
			if(!result.error && result.groupUserId) {
				Util.context.set({
					groupUsers: [...Util.context.getGroupUsers(), {
						...result,
						groupName: groupInvite.group.name //Slap on group name
					}]
				});
			}
		});
		
		//Client (remove invite)
		this.setState({
			groupInvites: this.state.groupInvites.filter(gi => gi.groupInviteId !== groupInvite.groupInviteId)
		});
	}
	render() {
		if(this.state.isLoading) return <div className="loader"></div>;

		return <div className="group-pending-info-user">
			<div className="group-pending-info">
				<h3 className="group-pending-info-heading">Pending group invites</h3>
				{Util.array.any(this.state.groupInvites)
					? this.state.groupInvites.map(groupInvite => {
						return <div key={groupInvite.groupInviteId} className="group-pending-info-item">
							<GroupAvatar size={32} group={groupInvite.group} to={Util.route.group(groupInvite.groupId)} />
							<div className="item-details">
								<p className="item-name"><Link to={Util.route.group(groupInvite.group.groupId)}>{groupInvite.group.name}</Link></p>
								<p className="item-subtitle sm"><Link to={Util.route.profile(groupInvite.invitedByUser.username)}>{groupInvite.invitedByUser.username}</Link> invited you to join {moment(groupInvite.createdAt).fromNow()}.</p>
							</div>
							<ContextMenu align="right" menuItems={[{
								label: 'Accept',
								onClick: () => this.acceptGroupInvite(groupInvite)
							}, {
								label: 'Ignore',
								onClick: () => this.ignoreGroupInvite(groupInvite)
							}]} />
						</div>
					})
					: <p className="empty-text">You don't have any group invites.</p>
				}
			</div>
			<div className="group-pending-info">
				<h3 className="group-pending-info-heading">Pending group requests</h3>
				{Util.array.any(this.state.groupRequests)
					? this.state.groupRequests.map(groupRequest => {
						return <div key={groupRequest.groupRequestId} className="group-pending-info-item">
							<GroupAvatar size={32} group={groupRequest.group} to={Util.route.group(groupRequest.groupId)} />
							<div className="item-details">
								<p className="item-name"><Link to={Util.route.group(groupRequest.group.groupId)}>{groupRequest.group.name}</Link></p>
								<p className="item-subtitle sm">You requested to join {moment(groupRequest.createdAt).fromNow()}.</p>
							</div>
						</div>
					})
					: <p className="empty-text">You don't have any pending group requests.</p>
				}
			</div>
		</div>;
	}
}

export default connect(null, { openModal })(GroupPendingInfoUser);