import React, { Component } from 'react';
import CountUp from 'react-countup';
import moment from 'moment';
import Util from '../../../Util';

import Button from '../../UI/Button/Button';
import TabbedPanels from '../../UI/TabbedPanels/TabbedPanels';
import ComicList from '../../UI/ComicList/ComicList';

export default class GroupPage extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true,
			group: null
		}
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
											<h2>{this.state.group.name}</h2>
											<p className="created-date sm">Created {moment(this.state.group.createdAt).fromNow()}</p>
											<div className="button-container">
												{Util.context.isInGroup(this.state.group.groupId)
													? <Button label="Leave group" />
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
											content: <div className=""></div>
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