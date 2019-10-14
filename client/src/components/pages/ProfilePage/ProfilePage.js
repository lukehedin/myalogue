import React, { Component } from 'react';
import Util from '../../../Util';
import moment from 'moment';

import ComicList from '../../UI/ComicList/ComicList';
import Button from '../../UI/Button/Button';
import Avatar from '../../UI/Avatar/Avatar';

//this.props.userIdOrUserName
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
		return this.props.userIdOrUserName !== prevProps.userIdOrUserName;
	}
	componentDidUpdate(prevProps, prevState, isNewUserIdOrUsername) {
		if(isNewUserIdOrUsername) this.fetchData();
	}
	fetchData() {
		this.setState({
			isLoading: true
		});
		
		Util.api.post('/api/getUser', isNaN(this.props.userIdOrUserName)
			? { requestedUsername: this.props.userIdOrUserName }
			: { requestedUserId: this.props.userIdOrUserName }
		)
		.then(result => {
			if(!result.error) {
				this.setState({
					user: result.user,
					userStats: result.userStats
				});
			}

			this.setState({
				isLoading: false
			})
		});
	}
	render() {
		let isMe = this.state.user && this.state.user.userId === Util.context.getUserId();

		return <div className="page-profile">
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<div className="user-info">
							{this.state.isLoading
								? <div className="loader"></div>
								: this.state.user
									? <div className="user-info-inner">
										<Avatar user={this.state.user} to={isMe ? Util.route.settings() : null} />
										<h1 className="page-title">{this.state.user.username}</h1>
										<p className="center sm">Joined {moment(this.state.user.createdAt).fromNow()}</p>
										{this.state.userStats.panelCount
											? <p className="center sm">{this.state.user.username} has made <b>{this.state.userStats.panelCount} </b>{Util.format.pluralise(this.state.userStats.panelCount, 'panel')} for <b>{this.state.userStats.comicCount}</b> {Util.format.pluralise(this.state.userStats.comicCount, 'comic')} with a total rating of <b>{this.state.userStats.comicTotalRating}</b>!</p>
											: null
										}
										{
											isMe ? <div className="button-container justify-center">
												<Button to={Util.route.settings()} label={'Edit profile'} colour="black" isHollow={true} />
											</div>
											: null
										}
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
						{this.state.user && !this.state.isLoading
							? <ComicList 
								sortBy={Util.enums.ComicSortBy.Newest}
								title={`Comics featuring ${this.state.user.username}`} 
								authorUserId={this.state.user.userId} 
							/>
							: null
						}
					</div>
				</div>
			</div>
		</div>;
	}
}