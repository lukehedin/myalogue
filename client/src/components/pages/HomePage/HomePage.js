import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import ComicList from '../../UI/ComicList/ComicList';

import logo_default from '../../../images/logo_black.png';
import logo_halloween from '../../../images/logo_halloween.png';
import logo_holidays from '../../../images/logo_holidays.png';
import logo_newyear from '../../../images/logo_newyear.png';
import Button from '../../UI/Button/Button';
import moment from 'moment';

export default class HomePage extends Component {
	constructor(props){
		super(props);

		this.state = {
			comicsInProgressCount: 0
		};
	}
	componentDidMount(){
		Util.api.post('/api/getComicsInProgressCount')
			.then(result => {
				if(!result.error) {
					this.setState({
						comicsInProgressCount: result.count,
						anonComicsInProgressCount: result.anonCount
					});
				}
			});
	}
	render() {
		let latestTemplate = Util.context.getLatestTemplate();

		let now = new Date();
		let logo = logo_default;

		let halloweenDate = new Date(now.getFullYear(), 9, 31, 23, 59, 59);
		let holidaysDate = new Date(now.getFullYear(), 11, 25, 23, 59, 59);
		let newYearDate = new Date(now.getFullYear() + 1, 0, 1, 23, 59, 59); // new years day

		let isHalloween = now < halloweenDate && now > moment(halloweenDate).subtract(1, 'week').toDate();
		let isHolidays = now < holidaysDate && now > moment(holidaysDate).subtract(1, 'week').toDate();
		let isNewYear = now < newYearDate && now > moment(newYearDate).subtract(2, 'days').toDate();

		if(isHalloween) logo = logo_halloween;
		if(isHolidays) logo = logo_holidays;
		if(isNewYear) logo = logo_newyear;

		return <div className="page-home">
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<div className="home-banner">
							<img src={logo} className="app-logo" alt="logo" />
							<p className="page-subtitle center">A game of improvisation where players write dialogue for panels in a comic without having complete knowledge of the overall story.</p>
						</div>
						<p className="play-info sm center"><span>Newest template: </span><Link to={Util.route.template(latestTemplate.templateId)}>{latestTemplate.name}</Link></p>
						<p className={`play-info sm center ${this.state.comicsInProgressCount ? '' : 'invisible'}`}><b>{this.state.comicsInProgressCount}</b> {Util.format.pluralise(this.state.comicsInProgressCount, 'comic')} in progress {this.state.anonComicsInProgressCount ? `(${this.state.anonComicsInProgressCount} anonymous)` : ``}</p>
						<div className="button-container justify-center">
							<Button label="Play" to={Util.route.play()} colour="pink" size="lg" />
						</div>
						<div className="button-container justify-center">
							<Button className="how-to-play-button" label="How to play" to={Util.route.howToPlay()} colour="pink" isHollow={true} size="sm" />
						</div>
					</div>
				</div>
			</div>
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<ComicList 
								sortBy={Util.isDev ? Util.enums.ComicSortBy.Newest : Util.enums.ComicSortBy.TopToday}
								title={`Completed comics`} 
						/>
					</div>
				</div>
			</div>
		</div>;
	}
}