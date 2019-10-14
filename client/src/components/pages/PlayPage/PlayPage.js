import React, { Component } from 'react';
import { Redirect, Link } from 'react-router-dom';
import Util from '../../../Util';

import Timer from '../../UI/Timer/Timer';
import ComicPanel from '../../UI/ComicPanel/ComicPanel';
import ComicPanelPair from '../../UI/ComicPanelPair/ComicPanelPair';
import Button from '../../UI/Button/Button';
import S4YButton from '../../UI/S4YButton/S4YButton';
import ProgressBar from '../../UI/ProgressBar/ProgressBar';

const playTimerMins = 2;

export default class PlayPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			error: null,
			isPlaying: false,
			isSubmitted: false,
			redirectToComicId: null,

			// Play data
			comicId: null,
			templatePanelId: null,
			currentComicPanel: null,

			dialogue: ''
		};

		this.playNew = this.playNew.bind(this);
		this.submitComicPanel = this.submitComicPanel.bind(this);
		this.onDialogueChange = this.onDialogueChange.bind(this);
		this.resetPlayData = this.resetPlayData.bind(this);
	}
	componentDidMount() {
		this.playNew(null, this.props.templateId, this.props.token);
	}
	onDialogueChange(value) {
		this.setState({
			dialogue: value
		});
	}
	resetPlayData() {
		this.setState({
			isSubmitted: false,
			isPlaying: false,
			comicId: null,
			templatePanelId: null,
			currentComicPanel: null,
			dialogue: '',
			completedPanelCount: null,
			totalPanelCount: null
		}, Util.selector.getRootScrollElement().scrollTo(0, 0));
	}
	playNew(skippedComicId, templateId, token) {
		this.resetPlayData();
		this.setState({
			isLoading: true
		});

		Util.api.post('/api/play', {
			// all optional
			skippedComicId: skippedComicId,
			templateId: templateId,
			token: token
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					isPlaying: true,
					isLoading: false,
					comicId: result.comicId,
					templatePanelId: result.templatePanelId,
					currentComicPanel: result.currentComicPanel, //May be null

					completedPanelCount: result.completedPanelCount,
					totalPanelCount: result.totalPanelCount
				}, () => {
					//Scroll down to play area, so long as the footer won't be visible
					let scrollEl = Util.selector.getRootScrollElement();
					let appInner = Util.selector.getAppInner();
					if(appInner.offsetHeight > window.innerHeight) scrollEl.scrollTo(0, appInner.offsetTop + 16);
				});
			} else {
				this.setState({
					error: result.error,
					isLoading: false
				});
			}
		});
	}
	submitComicPanel() {
		this.setState({
			isLoading: true,
			isPlaying: false
		}, Util.selector.getRootScrollElement().scrollTo(0, 0));
		
		let dialogue = this.state.dialogue;

		Util.api.post('/api/submitComicPanel', {
			comicId: this.state.comicId,
			dialogue: dialogue
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					isSubmitted: true,
					redirectToComicId: result.isComicCompleted ? this.state.comicId : null
				});
			} else {
				this.setState({
					error: result.error
				});
			}

			this.setState({
				isLoading: false
			});
		});
	}
	render() {
		if(this.state.redirectToComicId) return <Redirect to={Util.route.comic(this.state.redirectToComicId)} />;
		let content = null;

		if(this.state.isLoading) {
			//Loading
			content = <div className="play-area">
				<div className="loader"></div>
			</div>;
		} else if(this.state.error) {
			//Error
			content = <div className="play-area">
				<p className="empty-text center">{this.state.error}</p>
				<div className="button-container justify-center">
					<Button label="Back to home" to={Util.route.home()} colour="black" size="lg" />
				</div>
			</div>
		} else if(this.state.isPlaying) {
			//In progress
			content = <div className="play-area">
				<div className="play-area-top">
					<Timer autoStart={{ minutes: playTimerMins, seconds: 0 }} onComplete={this.resetPlayData} />
					<p className="instruction center sm">{this.state.currentComicPanel
						? this.state.totalPanelCount === this.state.completedPanelCount + 1 
							? `End` 
							: `Continue`
						: `Begin`} the comic</p>
					<ProgressBar 
						className={this.state.dialogue ? `with-dialogue` : ``}
						total={this.state.totalPanelCount} 
						amount={this.state.completedPanelCount + (this.state.dialogue ? 1 : 0)}
						label={`${this.state.completedPanelCount + (this.state.dialogue ? 1 : 0)} of ${this.state.totalPanelCount} panels completed`}
					/>
				</div>
				<ComicPanelPair>
					{this.state.currentComicPanel
						? <ComicPanel comicPanel={this.state.currentComicPanel} />
						: null
					}
					<ComicPanel onDialogueChange={this.onDialogueChange} templatePanelId={this.state.templatePanelId} />
				</ComicPanelPair> 
				<div className="play-actions button-container justify-center">
					<Button onClick={() => this.playNew(this.state.comicId)} colour="black" label="Skip" isHollow={true} size="md" />
					<Button onClick={() => this.submitComicPanel(this.state.dialogue)} className={this.state.dialogue ? '' : 'disabled'} colour="pink" label="I'm done!" size="md" />
				</div>
				<p className="center sm">If you can't think of anything, skip the panel</p>
			</div>;
		} else {
			//Not submitted, not in progress, must have ran out of time
			content = <div className="play-area">
				{this.state.isSubmitted 
					 ?<div>
						<h1 className="page-title">Panel created!</h1>
						{Util.context.isAuthenticated()
							? <p className="center">Your created a panel for <Link to={Util.route.comic(this.state.comicId)}>comic #{this.state.comicId}</Link>. You'll get a notification when your comic is completed.</p>
							: <p className="center">Your created a panel for <Link to={Util.route.comic(this.state.comicId)}>comic #{this.state.comicId}</Link>. Check back later to see how your comic turned out.</p>
						}
					</div>				
					: <div>
						<h1 className="page-title">Sorry, you ran out of time!</h1>
						<p className="center">Each time you play, you only have <b>{playTimerMins} minutes</b> to complete your panel.</p>
						<p className="center">Why not try again?</p>
					</div>
				}
				{Util.context.isAuthenticated()
					? null 
					: <div className="anon-message">
						<h4>Reminder: You're playing anonymously!</h4>
						<p className="center sm">If you <Link to={Util.route.register()}>create an account</Link> you'll be able to:</p>
						<ul>
							<li>Get a notification when your comic is completed</li>
							<li>Have your username appear on your comic panels</li>
							<li>Play the latest template as soon as it's available</li>
							<li>Play using any specific template of your choosing</li>
							<li>Contribute to comics featuring only logged-in users</li>
							<li>Rate and comment on comics</li>
						</ul>
					</div>
				}
				<div className="play-again-button button-container justify-center">
					<S4YButton label={this.state.isSubmitted ? 'Play again' : 'Try again'} onClick={() => this.playNew()} size="lg" />
				</div>
			</div>
		}

		return <div className="page-play">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						{content}
					</div>
				</div>
			</div>
		</div>;
	}
}