import React, { Component } from 'react';
import Util from '../../../Util';

import S4YButton from '../../UI/S4YButton/S4YButton';
import ComicList from '../../UI/ComicList/ComicList';

import logo from '../../../images/logo_black.png';

export default class HomePage extends Component {
	render() {
		let activeComicCount = Util.context.getActiveComicCount();

		return <div className="page-home">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<div className="home-banner">
							<img src={logo} className="app-logo" alt="logo" />
							<p className="page-subtitle center">A game where players take turns writing the dialogue for the panels of a comic, without knowing the full story.</p>
							<p className="page-subtitle center">Each player can use the previous panel to get an idea of where things were going, but the rest of the comic is hidden until it is completed.</p>
						</div>
						<div className="button-container justify-center">
							<S4YButton size="lg" />
						</div>
						<h5 className="in-progress-count">{activeComicCount} {Util.format.pluralise(activeComicCount, 'comic')} ready to play</h5>
					</div>
				</div>
			</div>
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<ComicList 
								sortBy={Util.enum.ComicSortBy.Newest}
								emptyText={`No comics to show! There better be a good reason for this...`}
								noMoreText={`Wow. You've read every comic. Are you proud of yourself? You should be!`}
								title={`Completed comics`} 
						/>
					</div>
				</div>
			</div>
		</div>;
	}
}