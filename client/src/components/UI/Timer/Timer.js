import React, { Component } from 'react';
import moment from 'moment';

export default class Timer extends Component {
	constructor(props){
		super(props)
		
		this.state = {
			time: 0,
			isOn: false
		};

		this.tenSeconds = new Date() - moment().subtract(10, 'seconds').toDate().getTime();
		this.timerInterval = null;

		this.startTimer = this.startTimer.bind(this);
		this.stopTimer = this.stopTimer.bind(this);
	}
	componentDidMount() {
		if(this.props.autoStart) this.startTimer(this.props.autoStart);
	}
	componentWillUnmount() {
		clearInterval(this.timerInterval);
	}
	startTimer(time) {
		this.setState({
			isOn: true
		});

		let untilTime = moment()
			.add(time.minutes, 'minutes')
			.add(time.seconds, 'seconds')
			.toDate();
		
		this.timerInterval = setInterval(() => {
			let newTime = untilTime - new Date();

			if(newTime > 0) {
				this.setState({
					time: newTime
				});
			} else {
				this.stopTimer();
			}
		}, 10);
	}
	stopTimer() {
		clearInterval(this.timerInterval);

		this.setState({
			isOn: false,
			time: 0
		});

		if(this.props.onComplete) this.props.onComplete();
	}
	render() {
		return <h2 className={`timer ${this.state.time < this.tenSeconds ? 'urgent' : ''}`}>{moment(this.state.time).format('mm:ss')}</h2>
	}
}