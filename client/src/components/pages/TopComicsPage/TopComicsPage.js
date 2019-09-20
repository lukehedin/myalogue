import React, { Component } from 'react';
import Util from '../../../Util';
import { Redirect } from 'react-router-dom';

import Comic from '../../UI/Comic/Comic';
import GameNavigation from '../../UI/GameNavigation/GameNavigation';
import Button from '../../UI/Button/Button';
import ComicTitle from '../../UI/ComicTitle/ComicTitle';

export default class TopComicsPage extends Component {
	render() {
		return <div className="page-hall-of-fame">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h2>Top comics</h2>
						<p className="page-subtitle center sm">The highest rated comics for each game. If you make a better comic for a game, it will appear in this list and at the top of it's game page.</p>
					</div>
				</div>
			</div>
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<table className="hall-of-fame-table">
							<tbody>
								{Util.context.getTopComics().map(comic => {
									let game = Util.context.getGameById(comic.gameId);
									return <tr key={comic.gameId} className="hall-of-fame-list-item">
										<td>
											<p className="sm"><b>Game {comic.gameId}</b>: <ComicTitle comic={comic} /> ({comic.rating})</p>
											<p className="sm">{game.description}</p>
										</td>
										<td className="cell-button">
											<Button to={Util.route.game(comic.gameId)} label="View" colour="black" />
										</td>
									</tr>
								})}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>;
	}
}