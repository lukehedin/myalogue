import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import S4YButton from '../../UI/S4YButton/S4YButton';
import ComicList from '../../UI/ComicList/ComicList';

import logo from '../../../images/logo_black.png';

export default class HomePage extends Component {
	render() {
		return <div className="page-home">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<img src={logo} className="app-logo" alt="logo" />
						<p className="page-subtitle center">A game where players take turns creating the story for panels in a comic. Each player can use the previous panel to get an idea of where the story was going, but the rest of the comic is hidden until it is completed.</p>
							<div className="button-container justify-center">
							<S4YButton size="lg" />
						</div>
					</div>
				</div>
			</div>
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<ComicList 
								sortBy={Util.enum.ComicSortBy.Newest}
								emptyText={`No recent comics to show! There better be a good reason for this...`}
								noMoreText={`Wow. You've read every comic. Are you proud of yourself? You should be!`}
								title={`Recent comics`} 
						/>
					</div>
				</div>
			</div>
		</div>;
	}
}