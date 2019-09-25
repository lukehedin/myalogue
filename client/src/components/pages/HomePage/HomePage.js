import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import S4YButton from '../../UI/S4YButton/S4YButton';
import ComicList from '../../UI/ComicList/ComicList';

export default class HomePage extends Component {
	render() {
		return <div className="page-login">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h2>Speak 4 Yourself</h2>
						<p className="center">A multiplayer game where players take turns continuing the story in a comic, while only having the previous panel to work out the overall plot.</p>
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