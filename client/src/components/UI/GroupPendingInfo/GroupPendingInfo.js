import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';
import Button from '../Button/Button';
import GroupAvatar from '../GroupAvatar/GroupAvatar';

export default class GroupPendingInfo extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,

			requests: null,
			invites: null
		};
	}
	componentDidMount() {
		Util.api.post('/api/getPendingGroupInfoForUser')
			.then(groupInfo => {
				this.setState({
					isLoading: false,

					requests: groupInfo.requests,
					invites: groupInfo.invites
				});
			});
	}
	acceptInvite(groupInviteId) {

	}
	declineInvite(groupInviteId) {
		
	}
	cancelRequest(groupRequestId) {
		
	}
	render() {
		if(this.state.isLoading) return <div className="loader"></div>;

		return <div className="requests">
			<div className="group-requests">
				{this.state.requests.map(request => {
					return <div className="group-request">

					</div>
				})}
			</div>
			<div className="group-invites">
				{this.state.invites.map(invite => {
					return <div className="group-invite">
						<GroupAvatar group={invite.group} />
						<div className="invite-detail">
							<p className="group-name"><Link to={Util.route.group(invite.group.groupId)}>{invite.group.name}</Link></p>
							<p className="invited-by"><Link to={Util.route.profile(invite.invitedByUser.username)}>{invite.invitedByUser.username}</Link> invited you to join.</p>
						</div>
						<div className="button-container direction-column">
							<Button label="Accept" size="sm" />
							<Button label="Decline" size="sm" isHollow={true} />
						</div>
					</div>
				})}
			</div>
		</div>;
	}
}