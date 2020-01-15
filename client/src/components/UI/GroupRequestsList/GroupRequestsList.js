import React, { Component } from 'react';
import Util from '../../../Util';

export default class GroupRequestsList extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,

			requests: null,
			invites: null
		};
	}
	componentDidMount() {
		Util.api.post('/api/getGroupRequests')
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
						
					</div>
				})}
			</div>
		</div>;
	}
}