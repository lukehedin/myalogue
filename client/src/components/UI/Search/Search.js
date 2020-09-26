import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import UserAvatar from '../UserAvatar/UserAvatar';
import GroupAvatar from '../GroupAvatar/GroupAvatar';

export default class AppHeader extends Component {
	constructor(props) {
		super(props);

		this.state = {
			searchValue: '',
			isSearching: false,
			isResultsPanelVisible: false,
			searchResults: {}
		};

		this.search = this.search.bind(this);
		this.clearSearchResults = this.clearSearchResults.bind(this);

		this.searchTimeout;
	}
	componentDidMount() {
		document.body.addEventListener('click', e => {
			if(!e.target.classList.contains('search') && !e.target.closest('.search')) {
				this.setState({
					isResultsPanelVisible: false
				});
			}
		});
	}
	search(searchValue) {
		this.setState({
			searchValue,
			isSearching: !!searchValue,
			isResultsPanelVisible: !!searchValue,
			searchResults: {}
		});

		if(this.searchTimeout) clearTimeout(this.searchTimeout);

		if(searchValue) {
			this.searchTimeout = setTimeout(() => {
				Util.api.post('/api/search', { search: searchValue })
					.then(results => {
						if(this.state.searchValue === searchValue) {
							this.setState({
								searchResults: results || {},
								isSearching: false
							});
						}
					});
			}, 500);
		}
	}
	clearSearchResults() {
		this.setState({
			searchValue: '',
			searchResults: {},
			isResultsPanelVisible: false
		});
	}
	render() {
		let { searchResults, isSearching, isResultsPanelVisible, searchValue } = this.state;
		const noSearchResults = searchValue && Util.array.none(searchResults.users) && Util.array.none(searchResults.groups) && Util.array.none(searchResults.templates);

		const getSearchResult = (subTitle, title, link, imageComponent) => {
			return <Link idx={subTitle} className="search-result" to={link} onClick={this.clearSearchResults}>
				{imageComponent || <div className="empty-image"></div>}
				<div className="search-result-detail">
					<h6 className="search-result-subtitle">{subTitle}</h6>
					<h4 className="search-result-title">{title}</h4>
				</div>
			</Link>
		};

		return <div className="search">
			<input className="search-input" placeholder="Search" value={searchValue} onChange={e => this.search(e.target.value)} />
			{isResultsPanelVisible && <div className="search-results">
				{noSearchResults && <p className="empty-text">{isSearching ? `Searching for "${searchValue}"` : `No results for "${searchValue}"`}</p>}
				{Util.array.any(searchResults.users) && searchResults.users.map(user => getSearchResult('User', user.username, Util.route.profile(user.username), <UserAvatar user={user} size={32} />))}
				{Util.array.any(searchResults.groups) && searchResults.groups.map(group => getSearchResult('Group', group.name, Util.route.group(group.groupId), <GroupAvatar group={group} size={32} />))}
				{Util.array.any(searchResults.templates) && searchResults.templates.map(template => getSearchResult('Template', template.name, Util.route.template(template.templateId)))}
			</div>}
		</div>
	}
}