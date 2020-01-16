import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openModal } from '../../../redux/actions';
import { Link } from 'react-router-dom';
import HTMLEllipsis from 'react-lines-ellipsis/lib/html';
import Util from '../../../Util';

import GroupAvatar from '../GroupAvatar/GroupAvatar';
import Dropdown from '../Dropdown/Dropdown';
import Button from '../Button/Button';
import ContextMenu from '../ContextMenu/ContextMenu';

class GroupList extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true,
			
			forUserId: this.props.forUserId,
			sortBy: this.props.sortBy || Util.enums.GroupSortBy.Popular,
			search: '',
			
			limit: this.props.limit || 20,
			offset: 0,

			groups: [],
			isNoMore: false
		};
		
		this.searchTimeout = null;

		this.leaveGroup = this.leaveGroup.bind(this);
		this.searchChanged = this.searchChanged.bind(this);
		this.setSortBy = this.setSortBy.bind(this);
	}
	componentDidMount() {
		this.fetchData();
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.forUserId !== prevProps.forUserId;
	}
	componentDidUpdate(prevProps, prevState, isNewProps) {
		if(isNewProps) this.resetFetch();
	}
	resetFetch() {
		clearTimeout(this.searchTimeout);

		this.setState({
			offset: 0,
			isNoMore: false,
			groups: []
		}, () => this.fetchData());
	}
	setSortBy(sortBy) {
		this.setState({
			sortBy: sortBy
		}, this.resetFetch);
	}
	searchChanged(e) {
		clearTimeout(this.searchTimeout);

		let newVal = e.target.value;

		this.setState({
			isLoading: true,
			search: newVal
		});

		this.searchTimeout = setTimeout(() => this.resetFetch(), 1000);
	}
	fetchData() {
		this.setState({
			isLoading: true
		});

		let params = {
			//Optional
			forUserId: this.props.forUserId,

			sortBy: this.state.sortBy,
			search: this.state.search,

			limit: this.state.limit,
			offset: this.state.offset
		}

		Util.api.post('/api/getGroups', params)
			.then(result => {
				if(!result.error) {
					let paramsChanged = params.forUserId !== this.props.forUserId 
						|| params.sortBy !== this.state.sortBy 
						|| params.search !== this.state.search;

					if(!paramsChanged) {
						this.setState({
							groups: [...this.state.groups, ...result],
							isLoading: false,
							offset: this.state.offset + this.state.limit,
							isNoMore: result.length < this.state.limit
						});
					}
				}
			});
	}
	leaveGroup(group) {
		this.props.openModal({
			type: Util.enums.ModalType.Confirm,
			title: 'Leave group',
			content: <p>Are you sure you want to leave the group "{group.name}"?</p>,
			yesLabel: 'Yes, leave group',
			noLabel: 'Cancel',
			yesFn: () => {
				let groupId = group.groupId;
				//Server
				Util.api.post('/api/leaveGroup', {
					groupId
				});
				//Client
				Util.context.set({
					groupUsers: Util.context.getGroupUsers().filter(gu => gu.groupId !== groupId)
				});
				this.setState({
					groups: this.state.groups.filter(group => group.groupId !== groupId)
				});
			}
		});
	}
	render() {
		let sortOptions = [{
			type: Util.enums.GroupSortBy.Popular,
			label: 'Popular'
		}, {
			type: Util.enums.GroupSortBy.Alphabetical,
			label: 'A to Z'
		}];

		if(!Util.context.isUserId(this.props.forUserId)) {
			//Viewing your groups
			sortOptions.push({
				type: Util.enums.GroupSortBy.Newest,
				label: 'Newest'
			})
		} else {
			if(Util.context.isAuthenticated()) {
				sortOptions.push({
					type: Util.enums.GroupSortBy.Mutual,
					label: 'Mutual'
				});
			}
		}

		return <div className="group-list">
			<div className="group-list-filters">
				<input className="search" placeholder="Search" onChange={this.searchChanged} value={this.state.search}></input>
				<div className="flex-spacer"></div>
				<Dropdown
					value={this.state.sortBy}
					onChange={value => this.setSortBy(value)}
					displayProp='label' 
					valueProp='type' 
					options={sortOptions}
				/>
			</div>
			<div className="group-list-inner">
				{Util.array.any(this.state.groups)
					? this.state.groups.map(group => {
						let contextMenuItems = [];

						if(this.props.showContextMenu && Util.context.isUserId(this.state.forUserId)) {
							if(Util.context.isGroupAdmin(group.groupId)) {
								contextMenuItems.push({
									label: 'Edit group',
									to: Util.route.groupEditor(group.groupId)
								});
							}
							contextMenuItems.push({
								label: 'Leave group',
								onClick: () => this.leaveGroup(group)
							});
						}

						return <div key={group.groupId} className="group-list-item">
							<GroupAvatar size={48} group={group} to={Util.route.group(group.groupId)} />
							<div className="group-details">
								<p className="group-name"><Link to={Util.route.group(group.groupId)}>{group.name}</Link></p>
								{!this.props.hideDescription && group.description
									? <HTMLEllipsis
										className="description"
										unsafeHTML={Util.format.userStringToSafeHtml(group.description)}
										maxLine='3'
										ellipsis='...'
										basedOn='letters'
									/>
									: null
								}
								<div className="group-bottom">
									<p className="sm">{group.memberCount} {Util.format.pluralise(group.memberCount, 'member')}</p>
									{Util.context.isGroupAdmin(group.groupId) ? <p className="group-bottom sm">You are an admin of this group</p> : null}
								</div>
							</div>
							{Util.array.any(contextMenuItems) 
								? <ContextMenu align="right" menuItems={contextMenuItems} />
								: null
							}
						</div>
					})
					: null
				}
			</div>
			{this.state.isNoMore
				? Util.array.none(this.state.groups)
					? <p className="empty-text">{this.props.emptyText || `No groups found.`}</p>
					: null
				: <div className="group-list-bottom">
					{this.state.isLoading 
						? <div className="loader"></div> 
						: <div className="button-container direction-column">
							<Button label="Load more" colour="pink" onClick={() => this.fetchData()} />
						</div>
					}
				</div>
			}
		</div>
	}
}

export default connect(null, { openModal })(GroupList);