import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
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
			isSubmitted: false,
			completedComicId: null,

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
		this.playNew();
	}
	onDialogueChange(value) {
		this.setState({
			dialogue: value
		});
	}
	resetPlayData() {
		this.setState({
			comicId: null,
			templatePanelId: null,
			currentComicPanel: null,
			dialogue: '',
			completedPanelCount: null,
			totalPanelCount: null
		});
	}
	playNew(skippedComicId) {
		this.resetPlayData();
		this.setState({
			isLoading: true
		});

		Util.api.post('/api/play', {
			skippedComicId: skippedComicId, //optional
			token: this.props.token //optional
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					comicId: result.comicId,
					templatePanelId: result.templatePanelId,
					currentComicPanel: result.currentComicPanel, //May be null

					completedPanelCount: result.completedPanelCount,
					totalPanelCount: result.totalPanelCount
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
	submitComicPanel() {
		this.resetPlayData();
		this.setState({
			isLoading: true
		});
		
		let dialogue = this.state.dialogue;

		Util.api.post('/api/submitComicPanel', {
			comicId: this.state.comicId,
			dialogue: dialogue
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					isSubmitted: true,
					completedComicId: result.completedComicId
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
		if(this.state.completedComicId) return <Redirect to={Util.route.comic(this.state.completedComicId)} />;
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
					<Button label="Back to home" to={Util.route.home()} colour="pink" size="lg" />
				</div>
			</div>
		} else if(this.state.templatePanelId) {
			//In progress
			content = <div className="play-area">
				<div className="play-area-top">
					<Timer autoStart={{ minutes: playTimerMins, seconds: 0 }} onComplete={this.resetPlayData} />
					<p className="center sm">{this.state.currentComicPanel
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
				<div className="button-container justify-center">
					<Button onClick={() => this.playNew(this.state.comicId)} colour="black" label="Skip" isHollow={true} size="lg" />
					<Button onClick={() => this.submitComicPanel(this.state.dialogue)} className={this.state.dialogue ? '' : 'disabled'} colour="pink" label="I'm done!" size="lg" />
				</div>
			</div>;
		} else {
			//Not submitted, not in progress, must have ran out of time
			content = <div className="play-area">
				{this.state.isSubmitted 
					 ?<div>
						<h1 className="page-title">Panel created!</h1>
						<p className="center">Your panel was created. You'll get a notification when the completed comic is ready.</p>
						<div className="button-container justify-center">
							<S4YButton label="Play again" onClick={() => this.playNew()} size="lg" />
						</div>
					</div>				
					: <div>
						<h1 className="page-title">Sorry, you ran out of time!</h1>
						<p className="center">Each time you play, you only have <b>{playTimerMins} minutes</b> to complete your panel.</p>
						<p className="center">Why not try again?</p>
						<div className="button-container justify-center">
							<S4YButton label="Try again" onClick={() => this.playNew()} size="lg" />				
						</div>
					</div>
				}
			</div>
		}

		return <div className="page-play">
			<div className="panel-standard responsive-padding">
				<div className="container">
					<div className="row">
						{content}
					</div>
				</div>
			</div>
		</div>;
	}
}