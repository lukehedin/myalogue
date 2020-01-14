import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openModal } from '../../../redux/actions';
import CountUp from 'react-countup';
import moment from 'moment';
import Util from '../../../Util';

import Button from '../../UI/Button/Button';
import TabbedPanels from '../../UI/TabbedPanels/TabbedPanels';
import ComicList from '../../UI/ComicList/ComicList';
import GroupAvatar from '../../UI/GroupAvatar/GroupAvatar';

class GroupPage extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true,
			group: null
		}

		this.leaveGroup = this.leaveGroup.bind(this);
	}
	componentDidMount() {
		Util.api.post('/api/getGroup', {
			groupId: this.props.groupId
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					group: result
				});
			}

			this.setState({
				isLoading: false
			});
		})
	}
	leaveGroup() {
		this.props.openModal({
			type: Util.enums.ModalType.Confirm,
			title: 'Leave group',
			content: <p>Are you sure you want to leave the group "{this.state.group.name}"?</p>,
			yesLabel: 'Yes, leave group',
			noLabel: 'Cancel',
			yesFn: () => {
				let groupId = this.state.group.groupId;
				//Server
				Util.api.post('/api/leaveGroup', {
					groupId
				});
				//Client
				Util.context.set({
					groupUsers: Util.context.getGroupUsers().filter(gu => gu.groupId !== groupId)
				});
			}
		});
	}
	render() {
		return <div className="page-group">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<div className="page-group-inner">
							{this.state.isLoading
								? <div className="loader"></div>
								: this.state.group 
									? <div className="group-info">
										<div className="group-info-header">
											<GroupAvatar size={96} group={this.state.group} />
											<h2>{this.state.group.name}</h2>
											<p className="created-date sm">Created {moment(this.state.group.createdAt).fromNow()}</p>
											<div className="group-actions button-container justify-center">
												{Util.context.isInGroup(this.state.group.groupId)
													? <div className="button-container justify-center">
														{Util.context.isGroupAdmin(this.state.group.groupId)
															? <Button size="sm" label="Edit group" to={Util.route.groupEditor(this.state.group.groupId)} />
															: null
														}
														<Button size="sm" label="Leave group" onClick={this.leaveGroup} />
													</div>
													: this.state.group.isPublic
														? <Button label="Join group" />
														: <Button label="Request to join" />
												}
											</div>
										</div>
										<TabbedPanels tabs={[{
											tabId: 'details',
											title: 'Details',
											content: <div className="group-details">
												{this.state.group.instruction 
													? <div>
														<h5>Group instruction:</h5>
														<p className="group-instruction">{this.state.group.instruction}</p>
													</div>
													: null
												}
												{this.state.group.description 
													? <p className="group-description">{this.state.group.description}</p> 
													: null
												}
												<div className="group-stats">
													<div className="group-stat">
														<h1><CountUp end={this.state.group.groupUsers.length} /></h1>
														<h5>Members</h5>
													</div>
													<div className="group-stat">
														<h1><CountUp end={this.state.group.comicCount} /></h1>
														<h5>Comics</h5>
													</div>
												</div>
											</div>
										}, {
											tabId: 'members',
											title: 'Members',
											content: <div className="member-list">
												{this.state.group.groupUsers.map(groupUser => {
													return <div className="member-list-item">
														{groupUser.user.username}
													</div>
												})}
											</div>
										}]} />
										<ComicList 
											sortBy={Util.enums.ComicSortBy.Newest}
											title={`Comics by ${this.state.group.name}`} 
											groupId={this.state.group.groupId}
											emptyText={`This group hasn't made any comics yet.`} 
										/>
									</div>
									: <p className="empty-text">Group not found.</p>
							}
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}

export default connect(null, { openModal })(GroupPage);