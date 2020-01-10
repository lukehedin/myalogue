import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import CountUp from 'react-countup';
import moment from 'moment';
import Util from '../../../Util';

export default class PlayInfo extends Component {
	constructor(props){
		super(props);

		this.state = {
			comicsInProgress: {},
			previousComicsInProgress: {},
			lastComicStartedAt: null
		};

		this.playInfoInterval = null;
	}
	componentWillUnmount() {
		clearInterval(this.playInfoInterval);
	}
	componentDidMount() {
		this.fetchPlayInfo();
	}
	fetchPlayInfo() {
		Util.api.post('/api/getPlayInfo')
			.then(result => {
				if(!result.error) {
					this.setState({
						comicsInProgress: result.comicsInProgress,
						previousComicsInProgress: this.state.comicsInProgress,
						lastComicStartedAt: result.lastComicStartedAt
					});
				}
					
				if(!this.playInfoInterval) {
					this.playInfoInterval = setInterval(() => this.fetchPlayInfo(), 60000);
				}
			});
	}
	render() {
		let now = new Date();

		return <div className="play-info">
			<p className="sm"><b><CountUp start={this.state.previousComicsInProgress.comicsInProgressCount || 0} end={this.state.comicsInProgress.comicsInProgressCount || 0} /></b> {Util.format.pluralise(this.state.comicsInProgress.comicsInProgressCount, 'comic')} in progress</p>
			{Util.context.isAuthenticated()
				? <p className="sm">(you've made panels for <b>{this.state.comicsInProgress.myComicsInProgressCount ? <CountUp start={this.state.previousComicsInProgress.myComicsInProgressCount || 0} end={this.state.comicsInProgress.myComicsInProgressCount} /> : 'none'}</b> of them)</p>
				: <p className="sm">(<CountUp start={this.state.previousComicsInProgress.anonComicsInProgressCount || 0} end={this.state.comicsInProgress.anonComicsInProgressCount || 0} /> anonymous)</p>
			}
			{Util.context.isAuthenticated()
				? <div className="start-new-info">
					{!this.state.lastComicStartedAt || moment.duration(moment(this.state.lastComicStartedAt).diff(now)).asHours() <= 6
						? <p className="sm">You can <Link to={Util.route.home()}>start a new comic</Link> now!</p>
						: <p className="sm">You can start a new comic in {moment(this.state.lastComicStartedAt).fromNow()}</p>
					}
				</div>
				: null
			}
		</div>
	}
}