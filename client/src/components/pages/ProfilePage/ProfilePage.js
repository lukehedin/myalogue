import React, { Component } from 'react';
import Util from '../../../Util';

import ComicList from '../../UI/ComicList/ComicList';

//this.props.userId
export default class ProfilePage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,

			user: null,
			comics: []
		};
	}
	componentDidMount() {
		Util.api.post('/api/getUser', {
			requestedUserId: this.props.userId
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					isLoading: false,
					user: result
				});
			}
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
										<h2>{this.state.user.username}</h2>
										{/* <p>Member since </p> */}
									</div>
									: <p className="empty-text">User not found</p>
							}
						</div>
					</div>
				</div>
			</div>
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						{this.state.user
							? <ComicList 
								emptyText={`${this.state.user.username} hasn't made any comics yet. What a slacker!`}
								noMoreText={`That's all the comics ${this.state.user.username} has made so far. Who knows what crazy comics they'll come up with next?`}
								title={`Comics by ${this.state.user.username}`} 
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