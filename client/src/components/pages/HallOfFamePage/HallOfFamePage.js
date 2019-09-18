import React, { Component } from 'react';
import Util from '../../../Util';
import { Redirect } from 'react-router-dom';

import Comic from '../../UI/Comic/Comic';
import GameNavigation from '../../UI/GameNavigation/GameNavigation';
import Button from '../../UI/Button/Button';
import ComicTitle from '../../UI/ComicTitle/ComicTitle';

export default class HallOfFamePage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			
			comics: [],
			viewingGameId: null
		};
	}
	componentDidMount() {
		Util.api.post('/api/getHallOfFameComics')
			.then(result => {
				if(!result.error) {
					this.setState({
						comics: result
					});
				}
				
				this.setState({
					isLoading: false
				});

				this.setViewingGameId(this.props.gameId || Util.context.getLatestGameId());
			});
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.gameId !== prevProps.gameId;
	}
	componentDidUpdate(prevProps, prevState, isNewGameId) {
		if(isNewGameId) this.setViewingGameId(this.props.gameId); //a new gameId
	}
	setViewingGameId(gameId, goBackToTop = false) {
		let viewingGameId = parseInt(gameId, 10);
		
		this.setState({
			viewingGameId
		});

		if(goBackToTop) Util.selector.getRootScrollElement().scrollTo(0, 0);
	}
	render() {
		let viewingGame = Util.context.getGameById(this.state.viewingGameId);
		let viewingComic = Util.array.any(this.state.comics)
			? this.state.comics.find(comic => comic.gameId === this.state.viewingGameId)
			: null;

		return <div className="page-hall-of-fame">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h2>Hall of Fame</h2>
						<p className="center sm">The highest rated comics for each game make it into the Hall of Fame. If your comic is rated higher than one of these comics, you'll steal their place!</p>
						{this.state.viewingGameId
							? <GameNavigation toFn={Util.route.hallOfFame} gameId={this.state.viewingGameId} />
							: null
						}
					</div>
				</div>
			</div>
			{this.state.isLoading
				? null
				: <div className="panel-inset">
					<div className="container">
						<div className="row">
							{!viewingComic
								? <p className="empty-text">No one has made a comic in this game. If you make the first one, you'll (at least temporarily) be in the Hall of Fame!</p>
								: null
							}
							{viewingGame
								? <Comic key={this.state.viewingGameId} gameId={viewingGame.gameId} comic={viewingComic} />
								: null
							}
						</div>
					</div>
				</div>
			}
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						{this.state.isLoading 
							? <div className="loader"></div>
							: <table className="hall-of-fame-table">
								<tbody>
									{this.state.comics.map(comic => {
										let game = Util.context.getGameById(comic.gameId);

										return <tr key={comic.gameId} className="hall-of-fame-list-item">
											{/* {} todo comic.title, game.id, username etc */}
											<td>
												<p className="sm"><b>Game {comic.gameId}</b>: <ComicTitle comic={comic} /> ({comic.rating})</p>
												{/* <p className="sm">{game.description}</p> */}
											</td>
											<td className="cell-button">
												<Button onClick={() => this.setViewingGameId(comic.gameId, true)} label="View" colour="black" />
											</td>
										</tr>
									})}
								</tbody>
							</table>
						}
					</div>
				</div>
			</div>
		</div>;
	}
}