import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openModal } from '../../../redux/actions';
import { Link } from 'react-router-dom';
import CountUp from 'react-countup';
import moment from 'moment';
import Util from '../../../Util';

import Button from '../../UI/Button/Button';
import TabbedPanels from '../../UI/TabbedPanels/TabbedPanels';
import ComicList from '../../UI/ComicList/ComicList';
import GroupAvatar from '../../UI/GroupAvatar/GroupAvatar';
import UserAvatar from '../../UI/UserAvatar/UserAvatar';

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
	joinGroup() {

	}
	requestToJoinGroup() {

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
					<div className="group-actions button-container">
						{Util.context.isInGroup(this.state.group.groupId)
							? <div className="button-container">
								{Util.context.isGroupAdmin(this.state.group.groupId)
									? <Button size="sm" label="Edit group" to={Util.route.groupEditor(this.state.group.groupId)} />
									: null
								}
								<Button size="sm" label="Leave group" onClick={this.leaveGroup} />
							</div>
							: null
						}
					</div>
				</div>
			}, {
				tabId: 'members',
				title: 'Members',
				content: <div className="member-list">
					{this.state.group.groupUsers.map(groupUser => {
						return <div className="member-list-item">
							<UserAvatar size={32} to={Util.route.profile(groupUser.user.username)} user={groupUser.user} />
							<div className="member-list-item-detail">
								<h4 className="username"><Link to={Util.route.profile(groupUser.user.username)}>{groupUser.user.username}</Link></h4>
								<p className="sm rating">Joined {moment(groupUser.createdAt).fromNow()}</p>
							</div>
						</div>
					})}
				</div>
			}];

			if(Util.array.any(this.state.group.groupChallenges) || Util.context.isGroupAdmin(this.state.group.groupId)) {
				tabs.push({
					tabId: 'challenges',
					title: 'challenges',
					content: <div className="group-challenge-list">
						{Util.array.any(this.state.group.groupChallenges)
							? this.state.group.groupChallenges.map(groupChallenge => {
								return <div className="group-challenge-item">
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
											<p className="created-date sm">Created {moment(this.state.group.createdAt).fromNow()}</p>
											{/* {this.state.group.instruction 
												? <p className="group-instruction sm">{this.state.group.instruction}</p>
												: null
											} */}
											{Util.context.isAuthenticated()
												? <div className="button-container group-call-to-action">
													{Util.context.isInGroup(this.state.group.groupId)
														? <Button colour="pink" label="Play with this group" />
														: this.state.group.isPublic
															? <Button colour="pink" label="Join group" />
															: <Button colour="pink" label="Request to join group" />
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