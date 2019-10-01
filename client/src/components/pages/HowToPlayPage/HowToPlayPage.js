import React, { Component } from 'react';
import Util from '../../../Util';
import { Redirect } from 'react-router-dom';

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
						<p className="center"><b>Speak<span className="pink">4</span>Yourself</b> is a game about trying to make funny comics with random people. You will be shown two comic panels; one will have some dialogue in it, and the other won’t have any at all.</p>
						<p className="center">Your goal is to <b>add dialogue to the empty panel</b>, continuing the story in the comic as best you can. If you're in charge of the very first panel, you can start the story off however you like!</p>
					</div>
				</div>
			</div>
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<div className="demo-pair">
							<ComicPanelPair>
								<ComicPanel comicPanel={demoPanel} />
								<ComicPanel templatePanelId={topComic.comicPanels[topComic.comicPanels.length - 1].templatePanelId} />
							</ComicPanelPair>
						</div>
					</div>
				</div>
			</div>
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<p className="center"><b>Every comic is different</b>. There are many different templates featuring unique situations for your dialogue, and most of the panels in a comic are ordered at random.</p>
						<p className="center">Keep making dialogue for different comics for as long as you want. When you check back later you'll have notifications for any completed comics that you contributed to.</p>
						<img className="how-to-play-image" src={notification_example_img} alt="Example notifications" />
						<p className="center">The completed comic might be amusing, confusing or bamboozling, depending on how everyone interpreted their panels.</p>
					</div>
				</div>
			</div>
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<div className="comic-wrapper">
							<Comic comic={topComic} />
						</div>
					</div>
				</div>
			</div>
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						{Util.context.isAuthenticated()
							? <div>
								<p className="center">They say the best way to learn is through experience. Have a go!</p>
								<div className="button-container justify-center">
									<Button to={Util.route.play()} colour="pink" size="lg" label="Play now" />
								</div>
							</div>
							: <div>
								<p className="center">You'll need an account to start playing.</p>
								<p className="center">It's quick, easy, and your email is <b>only used to verify your account</b>.</p>
								<div className="button-container justify-center">
									<Button to={Util.route.register()} colour="pink" size="lg" label="Get started" />
								</div>
							</div>
						}
					</div>
				</div>
			</div>
		</div>;
	}
}