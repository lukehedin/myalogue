import React, { Component } from 'react';
import Util from '../../../Util';
import { Redirect } from 'react-router-dom';

import S4YButton from '../../UI/S4YButton/S4YButton';
import ComicList from '../../UI/ComicList/ComicList';

import notification_example_img from './notification_example.png';
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
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h1 className="page-title">How to play</h1>
						<p className="center">Speak 4 Yourself is simple: Read the comic's previous panel, and add your own dialogue to the next.</p>
						<p className="center">If you are adding dialogue to the <b>first</b> panel, you can start off however you like.</p>
						<p className="center">If you are adding dialogue to the <b>last</b> panel, you'll get to see the completed comic as soon as you're done.</p>
					</div>
				</div>
			</div>
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<ComicPanelPair>
							<ComicPanel comicPanel={demoPanel} />
							<ComicPanel templatePanelId={topComic.comicPanels[topComic.comicPanels.length - 1].templatePanelId} />
						</ComicPanelPair>
					</div>
				</div>
			</div>
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<p className="center">You can keep making dialogue for different comics for as long as you want.</p>
						<p className="center">When you check back later, you'll have notifications for any completed comics that you added dialogue to.</p>
					</div>
				</div>
			</div>
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<img className="how-to-play-image" src={notification_example_img} alt="Example notifications" />
					</div>
				</div>
			</div>
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<p className="center">The completed comic's story might be amusing and/or confusing, depending on how everyone interprets their panels.</p>
						<p className="center">You'll get a better sense of how to steer the story the more you play.</p>
					</div>
				</div>
			</div>
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<div className="comic-wrapper">
							<Comic comic={topComic} />
						</div>
					</div>
				</div>
			</div>
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						{Util.context.isAuthenticated()
							? <div>
								<p className="center">What are you waiting for? Let's get creative!</p>
								<div className="button-container justify-center">
									<Button to={Util.route.play()} colour="pink" size="lg" label="Get started" />
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