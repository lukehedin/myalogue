import React, { Component } from 'react';
import Util from '../../../Util';
import moment from 'moment';

import ComicList from '../../UI/ComicList/ComicList';

//this.props.userId
export default class ProfilePage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			user: null
		};
	}
	componentDidMount() {
		this.fetchData();
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.userId !== prevProps.userId;
	}
	componentDidUpdate(prevProps, prevState, isNewUserId) {
		if(isNewUserId) this.fetchData();
	}
	fetchData() {
		this.setState({
			isLoading: true
		});
		
		Util.api.post('/api/getUser', {
			requestedUserId: this.props.userId
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					user: result
				});
			}

			this.setState({
				isLoading: false
			})
		});
	}
	render() {
		return <div className="page-profile">
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<div className="user-info">
							{this.state.isLoading
								? <div className="loader"></div>
								: this.state.user
									? <div className="user-info-inner">
										<h1 className="page-title">{this.state.user.username}</h1>
										<p className="page-subtitle">Joined {moment(this.state.user.createdAt).fromNow()}</p>
									</div>
									: <p className="empty-text">User not found.</p>
							}
						</div>
					</div>
				</div>
			</div>
			<div className="panel-stanard">
				<div className="container">
					<div className="row">
						{this.state.user
							? <ComicList 
								sortBy={Util.enum.ComicSortBy.Newest}
								emptyText={`${this.state.user.username} hasn't made any comic panels yet. What a slacker!`}
								noMoreText={`That's all the comics ${this.state.user.username} has made panels for.`}
								title={`Comics featuring ${this.state.user.username}`} 
								authorUserId={this.props.userId} 
							/>
							: null
						}
					</div>
				</div>
			</div>
		</div>;
	}
}