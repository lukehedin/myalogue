import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openModal } from '../../../redux/actions';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Util from '../../../Util';

import UserAvatar from '../UserAvatar/UserAvatar';
import ContextMenu from '../ContextMenu/ContextMenu';
import ButtonInput from '../../UI/ButtonInput/ButtonInput';

class GroupPendingInfoGroup extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,

			groupRequests: null,
			groupInvites: null,

			inviteResult: null, //Feedback message when a user is invited in member list
		};

		this.approveGroupRequest = this.approveGroupRequest.bind(this);
		this.denyGroupRequest = this.denyGroupRequest.bind(this);
		this.inviteUserToGroup = this.inviteUserToGroup.bind(this);
	}
	componentDidMount() {
		Util.api.post('/api/getPendingGroupInfoForGroup', {
			groupId: this.props.groupId
		})
		.then(groupInfo => {
			this.setState({
				isLoading: false,

				groupRequests: groupInfo.groupRequests,
				groupInvites: groupInfo.groupInvites
			});
		});
	}
	inviteUserToGroup(value) {
		this.setState({
			inviteResult: null
		});

		Util.api.post('/api/inviteUserToGroup', {
			username: value,
			groupId: this.props.groupId
		})
		.then(result => {
			if(!result.error) {
				if(result.groupUserId) {
					//If a group user was sent back (edge casey but can happen)
					this.setState({
						inviteResult: `${value} previously made a request to join, so they have been added to the group.`
					});
				} else if(result.groupInviteId) {
					this.setState({
						inviteResult: `An invite was sent to ${value}.`,
						groupInvites: [{
								...result,
								invitedByUser: Util.context.getUser()
							}, 
							...this.state.groupInvites]
					});
				}
			} else {
				this.setState({
					inviteResult: result.error
				});
			}
		})
	}
	denyGroupRequest(groupRequest) {
		this.props.openModal({
			type: Util.enums.ModalType.Confirm,
			title: 'Deny request',
			content: <div>
				<p className="center">Are you sure you want to deny the request from <b>{groupRequest.user.name}</b>?</p>
				<p className="center">You won't be able to receive another request from them for a while.</p>
			</div>,
			yesLabel: 'Yes, deny',
			noLabel: 'Cancel',
			yesFn: () => {
				//Server
				Util.api.post('/api/actionGroupRequest', {
					groupId: groupRequest.groupId,
					groupRequestId: groupRequest.groupRequestId,
					isApproving: false
				});
				//Client (remove request)
				this.setState({
					groupRequests: this.state.groupRequests.filter(gr => gr.groupRequestId !== groupRequest.groupRequestId)
				});
			}
		});
	}
	approveGroupRequest(groupRequest) {
		//Server
		Util.api.post('/api/actionGroupRequest', {
			groupId: groupRequest.groupId,
			groupRequestId: groupRequest.groupRequestId,
			isApproving: true
		})
		.then(result => {
			if(!result.error && result.groupUserId) {
				if(this.props.onNewGroupUser) this.props.onNewGroupUser({
					...result,
					user: groupRequest.user //Slap on user deets
				});
			}
		});
		
		//Client (remove request)
		this.setState({
			groupRequests: this.state.groupRequests.filter(gr => gr.groupRequestId !== groupRequest.groupRequestId)
		});
	}
	render() {
		return <div className="group-pending-info-group">
			<div className="invite-bar">
				<ButtonInput placeholder="Invite by username" buttonLabel="Invite" maxLength={20} onSubmit={this.inviteUserToGroup} />
				{this.state.inviteResult ? <p className="sm">{this.state.inviteResult}</p> : null}
			</div>
			<div className="group-pending-info-inner">
				{this.state.isLoading
					? <div className="loader"></div>
					: <div>
						<div className="group-pending-info">
							<h3 className="group-pending-info-heading">Pending group requests</h3>
							{Util.array.any(this.state.groupRequests)
								? this.state.groupRequests.map(groupRequest => {
									return <div key={groupRequest.groupRequestId} className="group-pending-info-item">
										<UserAvatar size={32} user={groupRequest.user} />
										<div className="item-details">
											<p className="item-name"><Link to={Util.route.profile(groupRequest.user.username)}>{groupRequest.user.username}</Link></p>
											<p className="item-subtitle sm"><Link to={Util.route.profile(groupRequest.user.username)}>{groupRequest.user.username}</Link> requested to join {moment(groupRequest.createdAt).fromNow()}.</p>
										</div>
										<ContextMenu align="right" menuItems={[{
											label: 'Approve',
											onClick: () => this.approveGroupRequest(groupRequest)
										}, {
											label: 'Deny',
											onClick: () => this.denyGroupRequest(groupRequest)
										}]} />
									</div>
								})
								: <p className="empty-text">This group doesn't have any pending requests.</p>
							}
						</div>
						<div className="group-pending-info">
							<h3 className="group-pending-info-heading">Pending group invites</h3>
							{Util.array.any(this.state.groupInvites)
								? this.state.groupInvites.map(groupInvite => {
									return <div key={groupInvite.groupInviteId} className="group-pending-info-item">
										<UserAvatar size={32} user={groupInvite.user} />
										<div className="item-details">
											<p className="item-name"><Link to={Util.route.profile(groupInvite.user.username)}>{groupInvite.user.username}</Link></p>
											<p className="item-subtitle sm"><Link to={Util.route.profile(groupInvite.invitedByUser.username)}>{groupInvite.invitedByUser.username}</Link> invited <Link to={Util.route.profile(groupInvite.user.username)}>{groupInvite.user.username}</Link> to join {moment(groupInvite.createdAt).fromNow()}.</p>
										</div>
									</div>
								})
								: <p className="empty-text">This group doesn't have any pending invites.</p>
							}
						</div>
					</div>
				}
			</div>
		</div>;
	}
}

export default connect(null, { openModal })(GroupPendingInfoGroup);