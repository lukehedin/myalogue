import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Util from '../../../Util';

import GroupAvatar from '../GroupAvatar/GroupAvatar';
import ContextMenu from '../ContextMenu/ContextMenu';

export default class GroupPendingInfoUser extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,

			groupRequests: null,
			groupInvites: null
		};
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
	acceptInvite(groupInviteId) {

	}
	declineInvite(groupInviteId) {
		
	}
	render() {
		if(this.state.isLoading) return <div className="loader"></div>;

		return <div className="group-pending-info-user">
			<div className="group-invites">
				<h3 className="pending-info-heading">Group invites</h3>
				{Util.array.any(this.state.groupInvites)
					? this.state.groupInvites.map(groupInvite => {
						return <div key={groupInvite.groupInviteId} className="group-invite">
							<GroupAvatar size={32} group={groupInvite.group} />
							<div className="group-invite-detail">
								<p className="group-name"><Link to={Util.route.group(groupInvite.group.groupId)}>{groupInvite.group.name}</Link></p>
								<p className="group-invited-by sm"><Link to={Util.route.profile(groupInvite.invitedByUser.username)}>{groupInvite.invitedByUser.username}</Link> invited you to join {moment(groupInvite.createdAt).fromNow()}.</p>
							</div>
							<ContextMenu align="right" menuItems={[{
								label: 'Accept'
							}, {
								label: 'Ignore'
							}]} />
						</div>
					})
					: <p className="empty-text">You don't have any group invitations.</p>
				}
			</div>
			<div className="group-requests">
				<h3 className="pending-info-heading">Pending group requests</h3>
				{Util.array.any(this.state.groupRequests)
					? this.state.groupRequests.map(groupRequest => {
						return <div className="group-request">
	
						</div>
					})
					: <p className="empty-text">You don't have any pending group requests.</p>
				}
			</div>
		</div>;
	}
}