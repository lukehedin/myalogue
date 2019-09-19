import React, { Component } from 'react';
import Util from '../../../Util';
import { Redirect } from 'react-router-dom';

import Comic from '../../UI/Comic/Comic';
import GameNavigation from '../../UI/GameNavigation/GameNavigation';
import ComicList from '../../UI/ComicList/ComicList';

export default class GamePage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			gameId: null,
			game: null,

			comic: null, //viewing comic for game (via link)

			comics: [], // comics for game
			comicOrderBy: 1,
			comicLimit: 3,
			comicSkip: 0
		};

		this.setComic = this.setComic.bind(this);
	}
	componentDidMount() {
		this.setGame();
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.gameId !== prevProps.gameId;
	}
	componentDidUpdate(prevProps, prevState, isNewGameId) {
		if(isNewGameId) this.setGame(); //a new gameId
	}
	setComic(comic) {
		this.setState({
			comic: comic
		});
	}
	setGame() {
		let gameId = this.props.gameId ? parseInt(this.props.gameId, 10) : null;
		let comicId = this.props.comicId ? parseInt(this.props.comicId, 10) : null;

		let game = gameId 
			? Util.context.getGameById(gameId) 
			: Util.context.getLatestGame();
		
		this.setState({
			gameId: gameId,
			game: game,
			comic: null,
			isLoading: !!comicId
		});
		
		if(comicId) {
			Util.api.post('/api/getComic', {
				comicId: comicId
			})
			.then(result => {
				if(result && !result.error && result.gameId === this.state.gameId) {
					this.setState({
						comic: result
					});
				}
				
				this.setState({
					isLoading: false
				});
			});
		}
	}
	render() {
		if(!this.state.isLoading && !this.state.game) return <Redirect to={Util.route.home()} />;

		return <div className="page-game">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						{this.state.gameId ? <GameNavigation toFn={Util.route.game} gameId={this.state.gameId} /> : null }
					</div>
				</div>
			</div>
			{!this.state.isLoading 
				? <div className="panel-inset">
					<div className="container">
						<div className="row">
							<div className="game-highlight-inner">
								<div>
									{this.props.comicId && !this.state.comic 
										? <p className="empty-text">The bad news is that the requested comic no longer exists. The good news is that you can make a new one right now!</p>
										: null
									}
									<Comic key={this.state.gameId} gameId={this.state.gameId} comic={this.state.comic} />
								</div>
							</div>
						</div>
					</div>
				</div>
				: null
			}
			<div className="panel-standard panel-game-feed">
				<div className="container">
					<div className="row">
						{!this.state.isLoading
							? <div className="game-feed">
								<GameNavigation toFn={Util.route.game} gameId={this.state.gameId} /> 
								<ComicList
									emptyText={`No comics have been made in this game. You could make the very first one!`}
									noMoreText={`Phew! That's all the comics that have been made in this game.`}
									fetchDelay={1000} //Prevent fast nav spamming
									sortBy={this.state.comic 
										? Util.enum.ComicSortBy.Random 
										: Util.context.getLatestGameId() === this.state.game.gameId
											? Util.enum.ComicSortBy.Newest
											: Util.enum.ComicSortBy.TopRated
									}
									gameId={this.state.game.gameId}
								/>
							</div>
							: <div className="loader"></div>
						}
					</div>
				</div>
			</div>
		</div>;
	}
}