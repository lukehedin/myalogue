import React, { Component } from 'react';
import CountUp from 'react-countup';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Util from '../../../Util';

import ComicList from '../../UI/ComicList/ComicList';
import Button from '../../UI/Button/Button';

import logo_default from '../../../images/logo_black.png';
import logo_halloween from '../../../images/logo_halloween.png';
import logo_holidays from '../../../images/logo_holidays.png';
import logo_newyear from '../../../images/logo_newyear.png';
import TemplatePanelCarousel from '../../UI/TemplatePanelCarousel/TemplatePanelCarousel';
import ComicPanel from '../../UI/ComicPanel/ComicPanel';

export default class HomePage extends Component {
	constructor(props){
		super(props);

		this.state = {
			lastHomeUpdateAt: new Date(),
			latestTemplate: Util.referenceData.getLatestTemplate(),
			comicsInProgress: {},
			previousComicsInProgress: {}
		};

		this.homeUpdateInterval = null;
		
		this.homeUpdate = this.homeUpdate.bind(this);
	}
	componentDidMount(){
		this.homeUpdate();

		this.homeUpdateInterval = setInterval(() => {
			if(document.hasFocus() && this.state.lastHomeUpdateAt < moment().subtract(1, 'minute').toDate()) {
				//If the document has focus and it has been more than a minute since last update, do one now
				this.homeUpdate();
			}
		}, 5000);
	}
	componentWillUnmount() {
		clearInterval(this.homeUpdateInterval);
	}
	homeUpdate() {
		this.setState({
			lastHomeUpdateAt: new Date()
		});

		Util.api.post('/api/homeUpdate', {
			existingTemplateIds: Util.referenceData.getTemplates().map(template => template.templateId)
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					comicsInProgress: result.comicsInProgress,
					previousComicsInProgress: this.state.comicsInProgress
				});

				if(Util.array.any(result.newTemplates)) {
					Util.referenceData.set({
						...Util.referenceData.get(),
						templates: [...Util.referenceData.getTemplates(), ...result.newTemplates]
					});

					this.setState({
						latestTemplate: Util.referenceData.getLatestTemplate()
					});
				}
			}
		});
	}
	render() {
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
				? <p className="header-subtitle comic-panel-width"><span>Latest template: </span><Link to={Util.route.template(this.state.latestTemplate.templateId)}>{this.state.latestTemplate.name}</Link></p>
				: <p className="header-subtitle comic-panel-width">A game of improvisation where players write dialogue for panels in a comic without having complete knowledge of the overall story.</p>
			}
		</div>

		let featureItem = <div className="feature-item">
			{Util.context.isAuthenticated()
				? <div className="latest-template-panel">
					<ComicPanel readOnly={true} templatePanelId={this.state.latestTemplate.templatePanels[0].templatePanelId} />
					<Link to={Util.route.template(this.state.latestTemplate.templatePanelId)} />
				</div>
				: <TemplatePanelCarousel />
			}
		</div>

		return <div className="page-home">
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<div className="home-inner">
							{homeHeader}
							<div className="home-detail">
								{homeHeader}
								{featureItem}
								<div className="play-panel">
									{Util.context.isAuthenticated()
										? null
										: <Button className="how-to-play-button" label="How to play" to={Util.route.howToPlay()} colour="pink" isHollow={true} size="md" />
									}
									<Button label="Play" to={Util.route.play()} colour="pink" size="lg" />
									<div className="play-info">
										<p className="sm"><b><CountUp start={this.state.previousComicsInProgress.comicsInProgressCount || 0} end={this.state.comicsInProgress.comicsInProgressCount || 0} /></b> {Util.format.pluralise(this.state.comicsInProgress.comicsInProgressCount, 'comic')} in progress</p>
										{Util.context.isAuthenticated()
											? <p className="sm">(you've made panels for <b>{this.state.comicsInProgress.myComicsInProgressCount ? <CountUp start={this.state.previousComicsInProgress.myComicsInProgressCount || 0} end={this.state.comicsInProgress.myComicsInProgressCount} /> : 'none'}</b> of them)</p>
											: <p className="sm">(<CountUp start={this.state.previousComicsInProgress.anonComicsInProgressCount || 0} end={this.state.comicsInProgress.anonComicsInProgressCount || 0} /> anonymous)</p>
										}
									</div>
								</div>
							</div>
							<div className="home-feature">
								{featureItem}
							</div>
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