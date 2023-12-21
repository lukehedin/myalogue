import React, { Component } from 'react';
import { Redirect, Link } from 'react-router-dom';
import Util from '../../../Util';

import Timer from '../../UI/Timer/Timer';
import ComicPanel from '../../UI/ComicPanel/ComicPanel';
import ComicPanelPair from '../../UI/ComicPanelPair/ComicPanelPair';
import Button from '../../UI/Button/Button';
import ProgressBar from '../../UI/ProgressBar/ProgressBar';
import TipStrip from '../../UI/TipStrip/TipStrip';
import PlayButton from '../../UI/PlayButton/PlayButton';

const playTimerMins = 2;

export default class PlayPage extends Component {
	constructor(props) {
		super(props);

		let urlParams = new URLSearchParams(window.location.search);

		let templateId = Util.context.isAuthenticated() ? urlParams.get('pTemplateId') : null;
		let groupId = Util.context.isAuthenticated() ? urlParams.get('pGroupId') : null;
		let groupChallengeId = Util.context.isAuthenticated() ? urlParams.get('pGroupChallengeId') : null;

		this.state = {
			isLoading: true,
			error: null,
			isPlaying: false,
			isSubmitted: false,
			redirectToComicId: null,

			//Play options (used to find comics to play with)
			templateId: templateId ? parseInt(templateId) : null,
			groupId: groupId ? parseInt(groupId) : null,
			groupChallengeId: groupChallengeId ? parseInt(groupChallengeId) : null,

			// Play data (for the current comic)
			comicId: null,
			templatePanelId: null,
			groupName: null,
			challenge: null,
			currentComicPanel: null,

			dialogue: ''
		};

		this.playNew = this.playNew.bind(this);
		this.submitComicPanel = this.submitComicPanel.bind(this);
		this.onDialogueChange = this.onDialogueChange.bind(this);
		this.resetPlayData = this.resetPlayData.bind(this);
		this.clearOptions = this.clearOptions.bind(this);
	}
	componentDidMount() {
		this.playNew(null);
	}
	onDialogueChange(value) {
		this.setState({
			dialogue: value
		});
	}
	clearOptions() {
		this.setState({
			templateId: null,
			groupId: null,
			groupChallengeId: null
		});
	}
	resetPlayData() {
		this.setState({
			isSubmitted: false,
			isPlaying: false,
			comicId: null,
			templatePanelId: null,
			groupName: null,
			challenge: null,
			currentComicPanel: null,
			dialogue: '',
			completedPanelCount: null,
			totalPanelCount: null
		}, Util.selector.getRootScrollElement().scrollTo(0, 0));
	}
	playNew(skippedComicId) {
		this.resetPlayData();
		this.setState({
			isLoading: true
		});

		Util.api.post('/api/play', {
			// all optional
			skippedComicId: skippedComicId,
			
			templateId: this.state.templateId,
			groupId: this.state.groupId,
			groupChallengeId: this.state.groupChallengeId
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					isPlaying: true,
					isLoading: false,
					comicId: result.comicId,
					templatePanelId: result.templatePanelId,
					groupName: result.groupName,
					challenge: result.challenge,
					currentComicPanel: result.currentComicPanel, //May be null

					completedPanelCount: result.completedPanelCount,
					totalPanelCount: result.totalPanelCount
				}, () => {
					//Scroll down to play area, so long as the footer won't be visible
					let scrollEl = Util.selector.getRootScrollElement();
					let appInner = Util.selector.getAppInner();
					if(appInner.offsetHeight > window.innerHeight) scrollEl.scrollTo(0, appInner.offsetTop);
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
		let hasOptions = this.state.templateId || this.state.groupId || this.state.groupChallengeId;
		if(this.state.redirectToComicId) {
			let queryParams = {};
			if(this.state.templateId) queryParams.pTemplateId = this.state.templateId;
			if(this.state.groupId) queryParams.pGroupId = this.state.groupId;
			if(this.state.groupChallengeId) queryParams.pGroupChallengeId = this.state.groupChallengeId;
			return <Redirect to={Util.route.withQueryParams(Util.route.comic(this.state.redirectToComicId), queryParams)} />;
		}
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
				<div className="button-container">
					<Button label="Back to home" to={Util.route.home()} colour="black" size="md" />
				</div>
			</div>
		} else if(this.state.isPlaying) {
			//In progress
			content = <div className="play-area">
				<div className="play-area-top">
					<Timer autoStart={{ minutes: playTimerMins, seconds: 0 }} onComplete={this.resetPlayData} />
					<p className="instruction center">{this.state.currentComicPanel
						? this.state.totalPanelCount === this.state.completedPanelCount + 1 
							? `Finish` 
							: `Continue`
						: `Begin`} the comic{this.state.groupName ? <span> for <span className="play-tag">{this.state.groupName}</span></span> : null}{this.state.challenge ? <span>, but also <span className="play-tag">{this.state.challenge}</span></span> : null}</p>
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
				<div className="play-actions button-container">
					<Button onClick={() => this.playNew(this.state.comicId)} colour="black" label="Skip" isHollow={true} size="md" />
					<Button onClick={() => this.submitComicPanel(this.state.dialogue)} className={this.state.dialogue ? '' : 'disabled'} colour="pink" label="I'm done!" size="md" />
				</div>
				<p className="center sm">If you can't think of anything, skip the panel</p>
			</div>;
		} else {
			//Not in progress, must have submitted or ran out of time
			content = <div className="play-area">
				{this.state.isSubmitted 
					? <div>
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
				{/* NOAUTH: Disable prompt to create an account */}
				{/* {Util.context.isAuthenticated()
					? null 
					: <div className="anon-message">
						<h4>Reminder: You're playing anonymously!</h4>
						<Button size="md" colour="pink" to={Util.route.register()} label="Create an account" />
						<p className="center sm">and you'll be able to:</p>
						<ul>
							<li>Get notified when your comics are completed.</li>
							<li>Rate and comment on comics.</li>
							<li>Play using any template of your choosing.</li>
							<li>Play the latest template as soon as it's up.</li>
							<li>Have your username appear on your comics.</li>
						</ul>
					</div>
				} */}
				<div className="button-container direction-column play-actions">
					<PlayButton title="Play again" onClick={() => this.playNew()} useQueryParams={true} allowClearOptions={true} onClearOptions={this.clearOptions} />
					<Button colour="black" label="I'm done playing" size="md" to={Util.route.home()} />
				</div>
				<hr />
				<p className="center sm">Enjoying S4Y? Get the app from Google Play:</p>
				<a style={{ width: '200px' }} href='https://play.google.com/store/apps/details?id=xyz.appmaker.qunped&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1'><img style={{ width: '100%' }} alt='Get it on Google Play' src='https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png'/></a>
				<p className="center sm">Or join the S4Y community on <a target="_blank" rel="noopener noreferrer" href="https://discord.gg/TcQPjvf">Discord</a>!</p>
				<TipStrip />
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