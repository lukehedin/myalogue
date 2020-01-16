import React, { Component } from 'react';
import CountUp from 'react-countup';
import Util from '../../../Util';

export default class StatsSummary extends Component {
	render() {
		return <div className="stats-summary">
			<div className="stat">
				<h5>Total comic rating</h5>
				<h1><CountUp end={this.props.totalRating} /></h1>
			</div>
			<div className="stats-row">
				<div className="stat">
					<h2><CountUp end={this.props.panelCount} /></h2>
					<h5>{Util.format.pluralise(this.props.panelCount, 'panel')}</h5>
				</div>
				<div className="stat">
					<h2><CountUp end={this.props.comicCount} /></h2>
					<h5>{Util.format.pluralise(this.props.comicCount, 'comic')}</h5>
				</div>
			</div>
		</div>;
	}
}