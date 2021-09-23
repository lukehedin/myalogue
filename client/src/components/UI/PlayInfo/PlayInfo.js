import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import CountUp from 'react-countup';
import moment from 'moment';
import Util from '../../../Util';
import ProgressBar from '../ProgressBar/ProgressBar';

export default class PlayInfo extends Component {
	constructor(props){
		super(props);

		this.state = {
			comicsInProgress: {},
			previousComicsInProgress: {}
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
						previousComicsInProgress: this.state.comicsInProgress
					});
				}
					
				if(!this.playInfoInterval) {
					this.playInfoInterval = setInterval(() => this.fetchPlayInfo(), 60000);
				}
			});
	}
	render() {
		const { comicsInProgressCount, myComicsInProgressCount } = this.state.comicsInProgress;
		let percent = myComicsInProgressCount ? ((myComicsInProgressCount/comicsInProgressCount) * 100).toFixed(1) : 0;

		return <div className="play-info">
			{Util.context.isAuthenticated() ? 
			<>
				<ProgressBar amount={myComicsInProgressCount || 0} total={comicsInProgressCount || 1} label={`you've made panels for ${percent ? percent + '%' : 'none'}`} />
				<p className="sm">of the <b><CountUp start={this.state.previousComicsInProgress.comicsInProgressCount || 0} end={comicsInProgressCount || 0} /></b> {Util.format.pluralise(this.state.comicsInProgress.comicsInProgressCount, 'comic')} in progress</p>
			</> :
			<>
				<p className="sm"><b><CountUp start={this.state.previousComicsInProgress.comicsInProgressCount || 0} end={comicsInProgressCount || 0} /></b> {Util.format.pluralise(this.state.comicsInProgress.comicsInProgressCount, 'comic')} in progress</p>
				<p className="sm">(<CountUp start={this.state.previousComicsInProgress.anonComicsInProgressCount || 0} end={this.state.comicsInProgress.anonComicsInProgressCount || 0} /> anonymous)</p>
			</>
			}
			
		</div>
	}
}