import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openModal } from '../../../redux/actions';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Util from '../../../Util';

import Button from '../../UI/Button/Button';
import TabbedPanels from '../../UI/TabbedPanels/TabbedPanels';
import ComicList from '../../UI/ComicList/ComicList';
import GroupAvatar from '../../UI/GroupAvatar/GroupAvatar';
import UserAvatar from '../../UI/UserAvatar/UserAvatar';
import Checkbox from '../../UI/Checkbox/Checkbox';
import StatsSummary from '../../UI/StatsSummary/StatsSummary';
import ButtonInput from '../../UI/ButtonInput/ButtonInput';

class GroupPage extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true,
			group: null,
			groupUsers: null,
			groupStats: null,

			isJoining: false,

			inviteResult: null //Feedback message when a user is invited in member list
		}

		this.leaveGroup = this.leaveGroup.bind(this);
		this.setIsFollowing = this.setIsFollowing.bind(this);
		this.inviteUserToGroup = this.inviteUserToGroup.bind(this);
		this.joinGroup = this.joinGroup.bind(this);
	}
	componentDidMount() {
		Util.api.post('/api/getGroup', {
			groupId: this.props.groupId
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					group: result.group,
					groupUsers: result.groupUsers,
					groupStats: result.groupStats
				});
			}

			this.setState({
				isLoading: false
			});
		})
	}
	setIsFollowing() {
		let newIsFollowing = !this.state.group.isFollwing;

		this.setState({
			group: {
				...this.state.group,
				isFollowing: newIsFollowing
			}
		}, () => {
			Util.api.post('/api/setIsFollowingGroup', {
				isFollowing: newIsFollowing
			})
		});
	}
	joinGroup() {
		this.setState({
			isJoining: true
		});

		Util.api.post('/api/joinGroup', {
			groupId: this.state.group.groupId
		})
		.then(result => {
			if(!result.error) {
				if(result.groupUserId) {
					//If the result is a groupUser, we joind the public group
					Util.context.set({
						groupUsers: [...Util.context.getGroupUsers(), result]
					});
	
					this.setState({
						groupUsers: [
							...this.state.groupUsers,
							result
						]
					});
				} else if(result.groupRequestId) {
					//If the result is a groupRequest, we requested to join
					this.setState({
						group: {
							...this.state.group,
							pendingGroupRequest: result
						}
					});
				}
			}
			
			this.setState({
				isJoining: false
			});
		});
	}
	inviteUserToGroup(value) {
		this.setState({
			inviteResult: null
		});

		Util.api.post('/api/inviteUserToGroup', {
			username: value,
			groupId: this.state.group.groupId
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					inviteResult: `An invite was sent to ${value}.`
				});
			} else {
				this.setState({
					inviteResult: result.error
				});
			}
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
		let getTabs = () => {
			let tabs = [{
				tabId: 'details',
				title: 'Details',
				content: <div className="group-details">
					<StatsSummary 
						totalRating={this.state.groupStats.comicTotalRating}
						panelCount={this.state.groupStats.panelCount}
						comicCount={this.state.groupStats.comicCount}
					/>
					{this.state.group.description 
						? <p className="group-description" dangerouslySetInnerHTML={{ __html: Util.format.userStringToSafeHtml(this.state.group.description) }}></p> 
						: null
					}
					<div className="group-actions button-container">
						{Util.context.isInGroup(this.state.group.groupId)
							? <div className="button-container">
								<Button size="sm" label="Leave group" onClick={this.leaveGroup} />
							</div>
							: null
						}
						<div className="flex-spacer"></div>
						<Checkbox isSwitch={true} value={this.state.includeAnonymous} label="Follow this group" onChange={this.setIsFollowing} />
					</div>
				</div>
			}, {
				tabId: 'members',
				title: 'Members',
				content: <div className="member-list">
					{Util.context.isGroupAdmin(this.state.group.groupId)
						? <div className="invite-bar">
							<ButtonInput placeholder="Invite by username" buttonLabel="Invite" onSubmit={this.inviteUserToGroup} />
							{this.state.inviteResult ? <p className="sm">{this.state.inviteResult}</p> : null}
						</div>
						: null
					}
					{Util.array.any(this.state.groupUsers)
						? this.state.groupUsers.map(groupUser => {
							return <div key={groupUser.groupUserId} className="member-list-item">
								<UserAvatar size={32} to={Util.route.profile(groupUser.user.username)} user={groupUser.user} />
								<div className="member-list-item-detail">
									<h4 className="username"><Link to={Util.route.profile(groupUser.user.username)}>{groupUser.user.username}</Link></h4>
									<p className="sm rating">Joined {moment(groupUser.createdAt).fromNow()}</p>
								</div>
							</div>;
						})
						: <p className="empty-text">This group doesn't have any members.</p>
					}
				</div>
			}];

			if(Util.array.any(this.state.group.groupChallenges) || Util.context.isGroupAdmin(this.state.group.groupId)) {
				tabs.push({
					tabId: 'challenges',
					title: 'challenges',
					content: <div className="group-challenge-list">
						{Util.array.any(this.state.group.groupChallenges)
							? this.state.group.groupChallenges.map(groupChallenge => {
								return <div key={groupChallenge.groupChallengeId} className="group-challenge-item">
									{groupChallenge.challenge}
								</div>;
							})
							: <p className="empty-text">This group has no challenges.</p>
						}
					</div>
				});
			}

			return tabs;
		};
		

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
											<GroupAvatar size={96} 
												group={this.state.group} 
												to={Util.context.isGroupAdmin(this.state.group.groupId) ? Util.route.groupEditor(this.state.group.groupId) : null}
											/>
											<h2>{this.state.group.name}</h2>
											<p className="created-date sm">{this.state.groupUsers.length} {Util.format.pluralise(this.state.groupUsers, 'member')} - Created {moment(this.state.group.createdAt).fromNow()}</p>
											{/* {Util.context.isGroupAdmin(this.state.group.groupId)
												? <p className="admin-message sm">You are an administrator of this group</p>
												: null
											} */}
											{/* {this.state.group.instruction 
												? <p className="group-instruction sm">{this.state.group.instruction}</p>
												: null
											} */}
											{Util.context.isAuthenticated()
												? <div className="button-container group-call-to-action direction-column">
													{Util.context.isInGroup(this.state.group.groupId)
														? <Button colour="pink" label="Play with this group" to={Util.route.withQueryParams(Util.route.play(), { groupId: this.state.group.groupId })} />
														: this.state.group.pendingGroupRequest
															? <p className="join-info sm">You requested to join this group {moment(this.state.group.pendingGroupRequest.createdAt).fromNow()}.</p>
															: this.state.isJoining
																? <p className="join-info sm">{this.state.isPublic ? 'Joining...' : 'Requesting to join...'}</p>
																: <Button colour="pink" label={this.state.group.isPublic ? 'Join group' : 'Request to join group'} onClick={this.joinGroup} />
													}
													{Util.context.isGroupAdmin(this.state.group.groupId)
														? <Button size="sm" label="Edit group" to={Util.route.groupEditor(this.state.group.groupId)} />
														: null
													}
												</div>
												: null
											}
										</div>
										<TabbedPanels tabs={getTabs()} />
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