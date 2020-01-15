import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import HTMLEllipsis from 'react-lines-ellipsis/lib/html';
import Util from '../../../Util';

import GroupAvatar from '../GroupAvatar/GroupAvatar';
import Dropdown from '../Dropdown/Dropdown';

export default class GroupList extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true,
			
			sortBy: this.props.sortBy || Util.enums.GroupSortBy.Popular,
			search: '',

			groups: []
		};
		
		this.searchTimeout = null;

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
			search: this.state.search
		}

		Util.api.post('/api/getGroups', params)
			.then(result => {
				if(!result.error) {
					let paramsChanged = params.forUserId !== this.props.forUserId 
						|| params.sortBy !== this.state.sortBy 
						|| params.search !== this.state.search;

					if(!paramsChanged) {
						this.setState({
							groups: result,
							isLoading: false,
							offset: this.state.offset + this.state.limit,
							isNoMore: result.length < this.state.limit
						});
					}
				}
			});
	}
	render() {
		let sortOptions = [{
			type: Util.enums.GroupSortBy.Popular,
			label: 'Popular'
		}, {
			type: Util.enums.GroupSortBy.Newest,
			label: 'Newest'
		}, {
			type: Util.enums.GroupSortBy.Alphabetical,
			label: 'Alphabetical'
		}];

		if(Util.context.isAuthenticated()) {
			sortOptions.push({
				type: Util.enums.GroupSortBy.Mutual,
				label: 'Mutual'
			});
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
				{this.state.isLoading
					? <div className="loader"></div>
					: Util.array.any(this.state.groups)
						? this.state.groups.map(group => {
							return <div key={group.groupId} className="group-list-item">
								<GroupAvatar size={48} group={group} to={Util.route.group(group.groupId)} />
								<div className="group-details">
									<Link className="group-name" to={Util.route.group(group.groupId)}>{group.name}</Link>
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
									<p className="group-bottom sm">{group.groupUsers.length} {Util.format.pluralise(group.groupUsers, 'member')}{group.instruction ? ` - ${group.instruction}` : null}</p>
								</div>
							</div>
						})
						: <p className="empty-text">No groups found.</p>
				}
			</div>
		</div>
	}
}