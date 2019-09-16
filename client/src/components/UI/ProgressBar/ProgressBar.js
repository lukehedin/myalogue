import React, { Component } from 'react';

export default class ProgressBar extends Component {
	render() {
		let percent = (this.props.amount/this.props.total) * 100;
		return <div className="progress-bar">
			<div className="progress-bar-inner" style={{ width: `${percent}%` }} ></div>
		</div>
	}
}