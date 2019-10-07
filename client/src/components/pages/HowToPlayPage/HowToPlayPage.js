import React, { Component } from 'react';
import Util from '../../../Util';
import { Redirect, Link } from 'react-router-dom';

import notification_example_img from './notifications_example.png';
import ComicPanel from '../../UI/ComicPanel/ComicPanel';
import ComicPanelPair from '../../UI/ComicPanelPair/ComicPanelPair';
import Button from '../../UI/Button/Button';
import Comic from '../../UI/Comic/Comic';

export default class HowToPlayPage extends Component {
	render() {
		let topComic = Util.context.getTopComic();
		if(!topComic) return <Redirect to={Util.route.register()} />; //Should not happen

		let demoPanel = {
			...topComic.comicPanels[topComic.comicPanels.length - 2],
			userId: null,
			username: null
		}

		return <div className="page-how-to-play">
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<h1 className="page-title">How to play</h1>
						<p className="center">When you hit the play button, you will be shown two comic panels; one will have some dialogue in it, and the other won’t have any at all.</p>
						<p className="center">Your goal is to <b>add dialogue to the empty panel</b> and continue the comic's story as best you can.</p>
						<ComicPanelPair>
							<ComicPanel comicPanel={demoPanel} />
							<ComicPanel templatePanelId={topComic.comicPanels[topComic.comicPanels.length - 1].templatePanelId} />
						</ComicPanelPair>
						<p className="center">Another player will see your panel and have to write dialogue for the next. This process is repeated until the comic is complete.</p>
						<p className="center">The final comic might be amusing, confusing or utterly bamboozling depending on how everyone interpreted their panel.</p>
						<div className="comic-wrapper">
							<Comic comic={topComic} />
						</div>
						<p className="center"><b>Every comic is different</b>. There are many different templates featuring unique situations for your dialogue, and most of the panels are ordered at random.</p>
						<p className="center">You can make dialogue for as many comics as you want.
							{Util.context.isAuthenticated()
								? <span> When you check back later you'll have notifications for any completed comics you contributed to.</span>
								: <span> If you <Link to={Util.route.register()}>create an account</Link>, you'll get notifications for any completed comics that you contributed to.</span>
							}
						</p>
						<img className="how-to-play-image" src={notification_example_img} alt="Example notifications" />
						{Util.context.isAuthenticated()
							? <p className="center">What are you waiting for?</p>
							: <p className="center">There are many other benefits for players who have an account, but there's nothing stopping you from playing anonymously if you wish!</p>
						}
						<div className="button-container justify-center">
							<Button to={Util.route.play()} colour="pink" size="lg" label="Play now" />
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}