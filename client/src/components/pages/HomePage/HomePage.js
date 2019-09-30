import React, { Component } from 'react';
import Util from '../../../Util';

import S4YButton from '../../UI/S4YButton/S4YButton';
import ComicList from '../../UI/ComicList/ComicList';

import logo from '../../../images/logo_black.png';

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
						comicsInProgressCount: result
					});
				}
			});
	}
	render() {
		return <div className="page-home">
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<div className="home-banner">
							<img src={logo} className="app-logo" alt="logo" />
							<p className="page-subtitle center">A game where players take turns writing the dialogue for the panels of a comic, without knowing everything that has happened so far.</p>
						</div>
						<div className="button-container justify-center">
							<S4YButton size="lg" />
						</div>
						<p className={`in-progress-count ${this.state.comicsInProgressCount ? '' : 'invisible'} sm center`}>{this.state.comicsInProgressCount} {Util.format.pluralise(this.state.comicsInProgressCount, 'comic')} in progress</p>
					</div>
				</div>
			</div>
			<div className="panel-standard">
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