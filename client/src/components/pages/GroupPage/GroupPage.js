import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { openModal } from '../../../redux/actions';
import moment from 'moment';
import Util from '../../../Util';

import Button from '../../UI/Button/Button';
import TabbedPanels from '../../UI/TabbedPanels/TabbedPanels';
import ComicList from '../../UI/ComicList/ComicList';
import GroupAvatar from '../../UI/GroupAvatar/GroupAvatar';
import UserAvatar from '../../UI/UserAvatar/UserAvatar';
import StatsSummary from '../../UI/StatsSummary/StatsSummary';
import GroupPendingInfoGroup from '../../UI/GroupPendingInfoGroup/GroupPendingInfoGroup';
import ContextMenu from '../../UI/ContextMenu/ContextMenu';
import ButtonInput from '../../UI/ButtonInput/ButtonInput';
import CommentThread from '../../UI/CommentThread/CommentThread';

class GroupPage extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true,
			group: null,
			groupStats: null,

			redirectTo: null,

			isJoining: false
		}

		this.setRedirectToPlayWithGroup = this.setRedirectToPlayWithGroup.bind(this);
		this.joinGroup = this.joinGroup.bind(this);
		this.removeGroupUser = this.removeGroupUser.bind(this);
		this.appendNewGroupUser = this.appendNewGroupUser.bind(this);

		this.createGroupChallenge = this.createGroupChallenge.bind(this);
		this.removeGroupChallenge = this.removeGroupChallenge.bind(this);

		this.postGroupComment = this.postGroupComment.bind(this);
		this.deleteGroupComment = this.deleteGroupComment.bind(this);
		this.updateGroupComment = this.updateGroupComment.bind(this);
	}
	componentDidMount() {
		Util.api.post('/api/getGroup', {
			groupId: this.props.groupId
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					group: result.group,
					groupStats: result.groupStats
				});
			}

			this.setState({
				isLoading: false
			});
		})
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
					//Update CONTEXT
					Util.context.set({
						groupUsers: [...Util.context.getGroupUsers(), result]
					});
					//Update STATE
					this.appendNewGroupUser({
						...result,
						user: Util.context.getUser() //Slap on user deets
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
	appendNewGroupUser(newGroupUser) {
		this.setState({
			group: {
				...this.state.group,
				groupUsers: [
					newGroupUser,
					...this.state.group.groupUsers
				]
			}
		});
	}
	removeGroupUser(groupUser) {
		this.props.openModal({
			type: Util.enums.ModalType.Confirm,
			title: 'Remove from group',
			content: <div>
					<p className="center">Are you sure you want to remove {groupUser.user.username} from the group?</p>
				</div>,
			yesLabel: 'Yes, remove',
			noLabel: 'Cancel',
			yesFn: () => {
				//Server
				Util.api.post('/api/removeUserFromGroup', {
					groupId: this.state.group.groupId,
					removeUserId: groupUser.userId
				});

				//Client
				this.setState({
					group: {
						...this.state.group,
						groupUsers: this.state.group.groupUsers.filter(gu => gu.groupUserId !== groupUser.groupUserId)
					}
				});
			}
		});
	}
	setRedirectToPlayWithGroup(groupChallengeId) {
		const minUsers = 3;
		let params = { groupId: this.state.group.groupId };
		if(groupChallengeId) params.groupChallengeId = groupChallengeId;
		let redirectTo = Util.route.withQueryParams(Util.route.play(), params);

		if(this.state.group.groupUsers.length < minUsers) {
			this.props.openModal({
				type: Util.enums.ModalType.Confirm,
				title: 'Group comics will not complete',
				content: <div>
						<p className="center">Groups with less than {minUsers} members cannot complete comics. You can still begin making comics for the group, but they will remain incomplete until more members join.</p>
						<p className="center">Would you still like to play with this group?</p>
					</div>,
				yesLabel: 'Yes, play anyway',
				noLabel: 'Cancel',
				yesFn: () => {
					this.setState({
						redirectTo
					});
				}
			});
		} else {
			this.setState({
				redirectTo
			});
		}
	}
	createGroupChallenge(challenge) {
		//Server
		Util.api.post('/api/createGroupChallenge', {
			groupId: this.state.group.groupId,
			challenge
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					group: {
						...this.state.group,
						groupChallenges: [result, ...this.state.group.groupChallenges]
					}
				});
			}
		});
	}
	removeGroupChallenge(groupChallenge) {
		this.props.openModal({
			type: Util.enums.ModalType.Confirm,
			title: 'Remove group challenge',
			content: <div>
					<p className="center">Are you sure you want to remove "{groupChallenge.challenge}" from the group's challenges?</p>
					<p className="center">This will not remove the challenge from any existing comics.</p>
				</div>,
			yesLabel: 'Yes, remove',
			noLabel: 'Cancel',
			yesFn: () => {
				//Server
				Util.api.post('/api/removeGroupChallenge', {
					groupId: this.state.group.groupId,
					groupChallengeId: groupChallenge.groupChallengeId
				});

				//Client
				this.setState({
					group: {
						...this.state.group,
						groupChallenges: this.state.group.groupChallenges.filter(gc => gc.groupChallengeId !== groupChallenge.groupChallengeId)
					}
				});
			}
		});
	}
	postGroupComment(value, callback) {
		Util.api.post('/api/postGroupComment', {
			groupId: this.state.group.groupId,
			value
		})
		.then(result => {
			if(!result.error) {
				result.user = Util.context.getUser(); //Slap on this user's deets

				this.setState({
					group: {
						...this.state.group,
						groupComments: [...this.state.group.groupComments, result]
					}
				});

				if(callback) callback();
			}
		});
	}
	deleteGroupComment(groupComment) {
		//confirm code is on the comment component
		//Server
		Util.api.post('/api/deleteGroupComment', {
			groupId: this.state.group.groupId,
			groupCommentId: groupComment.groupCommentId
		});
	
		//Client
		this.setState({
			group: {
				...this.state.group,
				groupComments: this.state.group.groupComments.filter(c => c.groupCommentId !== groupComment.groupCommentId)
			}
		});
	}
	updateGroupComment(groupComment, value) {
		//Server
		Util.api.post('/api/updateGroupComment', {
			groupId: this.state.group.groupId,
			groupCommentId: groupComment.groupCommentId,
			value: value
		});

		//Client
		this.setState({
			group: {
				...this.state.group,
				groupComments: this.state.group.groupComments.map(gc => {
					return gc.groupCommentId !== groupComment.groupCommentId
						? gc
						: {
							...gc,
							value: value,
							updatedAt: new Date()
						}
				})
			}
		});
	}
	render() {
		if(this.state.redirectTo) return <Redirect to={this.state.redirectTo} />

		let isAdmin = this.state.group && Util.context.isGroupAdmin(this.state.group.groupId);
		let isInGroup = this.state.group && Util.context.isInGroup(this.state.group.groupId);

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
						? <div className="group-description" dangerouslySetInnerHTML={{ __html: Util.format.userStringToSafeHtml(this.state.group.description) }}></div> 
						: null
					}
					<div className="group-comments">
						{Util.array.any(this.state.group.groupComments)
							? null
							: <p className="empty-text">This group doesn't have any comments.</p>
						}
						<CommentThread comments={this.state.group.groupComments}
							onPostComment={this.postGroupComment}
							onUpdateComment={this.updateGroupComment}
							onDeleteComment={this.deleteGroupComment}
							hideCommentInput={!isInGroup}
						/>
					</div>
				</div>
			}, {
				tabId: 'members',
				title: 'Members',
				content: <div className="members">
					{isAdmin && !this.state.group.isPublic
						? <GroupPendingInfoGroup groupId={this.state.group.groupId} onNewGroupUser={this.appendNewGroupUser} />
						: null
					}
					<h3 className="members-heading">Members</h3>
					<div className="member-list">
						{Util.array.any(this.state.group.groupUsers)
							? this.state.group.groupUsers.map(groupUser => {
								return <div key={groupUser.groupUserId} className="member-list-item">
									<UserAvatar size={32} to={Util.route.profile(groupUser.user.username)} user={groupUser.user} />
									<div className="member-list-item-detail">
										<h4 className="username"><Link to={Util.route.profile(groupUser.user.username)}>{groupUser.user.username}</Link></h4>
										<p className="joined-at sm">Joined {moment(groupUser.createdAt).fromNow()}</p>
									</div>
									{isAdmin
										? <ContextMenu menuItems={[{
											label: 'Remove',
											onClick: () => this.removeGroupUser(groupUser)
										}]} />
										: null
									}
								</div>;
							})
							: <p className="empty-text">This group doesn't have any members.</p>
						}
					</div>
				</div>
			}];

			if(Util.array.any(this.state.group.groupChallenges) || isAdmin) {
				tabs.push({
					tabId: 'challenges',
					title: 'challenges',
					content: <div className="challenges">
						<p className="center sm">Challenges add variations to the rules when making a comic. For example: "make your dialogue rhyme", "make as many ocean-based puns as possible" or "the author of the last panel must speak like Yoda".</p>
						{isAdmin 
							? <ButtonInput placeholder="Enter a new challenge" maxLength={64} buttonLabel="Add" onSubmit={this.createGroupChallenge} />
							: null}
						{Util.array.any(this.state.group.groupChallenges)
							? <div className="group-challenges-list">
								{this.state.group.groupChallenges.map(groupChallenge => {
									return <div key={groupChallenge.groupChallengeId} className="group-challenge-item">
										<div className="challenge-detail">
											<p>{groupChallenge.challenge}</p>
											{isInGroup
												? <Button colour="pink" size="sm" label="Play with this challenge" onClick={() => this.setRedirectToPlayWithGroup(groupChallenge.groupChallengeId)} />
												: null
											}
										</div>
										{isAdmin 
											? <ContextMenu menuItems={[{
												label: 'Remove',
												onClick: () => this.removeGroupChallenge(groupChallenge)
											}]} />
											: null
										}
									</div>;
								})}
							</div>
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
												to={isAdmin ? Util.route.groupEditor(this.state.group.groupId) : null}
											/>
											<h2>{this.state.group.name}</h2>
											<p className="created-date sm">{this.state.group.isPublic ? 'Public' : 'Private'} group • {this.state.group.groupUsers.length} {Util.format.pluralise(this.state.group.groupUsers, 'member')} • Created {moment(this.state.group.createdAt).fromNow()}</p>
											{/* {isAdmin
												? <p className="admin-message sm">You are an administrator of this group</p>
												: null
											} */}
											{/* {this.state.group.instruction 
												? <p className="group-instruction sm">{this.state.group.instruction}</p>
												: null
											} */}
											{Util.context.isAuthenticated()
												? <div className="button-container group-call-to-action direction-column">
													{isInGroup
														? <Button colour="pink" label="Play with this group" onClick={() => this.setRedirectToPlayWithGroup()} />
														: this.state.group.pendingGroupRequest
															? <p className="join-info sm">You requested to join this group {moment(this.state.group.pendingGroupRequest.createdAt).fromNow()}.</p>
															: this.state.isJoining
																? <p className="join-info sm">{this.state.group.isPublic ? 'Joining...' : 'Requesting to join...'}</p>
																: <Button colour="pink" label={this.state.group.isPublic ? 'Join group' : 'Request to join group'} onClick={this.joinGroup} />
													}
													{isAdmin
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