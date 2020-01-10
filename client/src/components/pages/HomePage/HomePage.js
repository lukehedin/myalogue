import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Util from '../../../Util';

import ComicList from '../../UI/ComicList/ComicList';
import Button from '../../UI/Button/Button';
import PlayInfo from '../../UI/PlayInfo/PlayInfo';

import logo_default from '../../../images/logo_black.png';
import logo_halloween from '../../../images/logo_halloween.png';
import logo_holidays from '../../../images/logo_holidays.png';
import logo_newyear from '../../../images/logo_newyear.png';
import TemplatePanelCarousel from '../../UI/TemplatePanelCarousel/TemplatePanelCarousel';

export default class HomePage extends Component {
	render() {
		let latestTemplate = Util.context.getLatestTemplate();
		
		let now = new Date();
		let logo = logo_default;

		const halloweenDate = new Date(now.getFullYear(), 9, 31, 23, 59, 59);
		const holidaysDate = new Date(now.getFullYear(), 11, 25, 23, 59, 59);
		const newYearDate = new Date(now.getFullYear() + 1, 0, 1, 23, 59, 59); // new years day

		let isHalloween = now < halloweenDate && now > moment(halloweenDate).subtract(1, 'week').toDate();
		let isHolidays = now < holidaysDate && now > moment(holidaysDate).subtract(1, 'week').toDate();
		let isNewYear = now < newYearDate && now > moment(newYearDate).subtract(2, 'days').toDate();

		if(isHalloween) logo = logo_halloween;
		if(isHolidays) logo = logo_holidays;
		if(isNewYear) logo = logo_newyear;

		let homeHeader = <div className="home-header">
			<img src={logo} className="app-logo" alt="logo" />
			{Util.context.isAuthenticated()
				? <p className="header-subtitle comic-panel-width"><span>Latest template: </span><Link to={Util.route.template(latestTemplate.templateId)}>{latestTemplate.name}</Link></p>
				: <p className="header-subtitle comic-panel-width">A game of improvisation where players write dialogue for panels in a comic without having complete knowledge of the overall story.</p>
			}
		</div>

		let templatePanelCarousel = <TemplatePanelCarousel
			withLilBuddy={!Util.context.isAuthenticated()}
		/>;

		return <div className="page-home">
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<div className="home-inner">
							{homeHeader}
							<div className="home-detail">
								{homeHeader}
								{templatePanelCarousel}
								<div className="play-panel">
									<Button label="Play" className="play-button" to={Util.route.play()} colour="pink" size="lg" />
									{Util.context.isAuthenticated()
										? null
										: <Button label="How to play" to={Util.route.howToPlay()} colour="pink" isHollow={true} size="md" />
									}
									<PlayInfo />
								</div>
							</div>
							<div className="home-feature">
								{templatePanelCarousel}
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<ComicList 
								sortBy={Util.enums.ComicSortBy.Hot}
								title={`Completed comics`} 
						/>
					</div>
				</div>
			</div>
		</div>;
	}
}