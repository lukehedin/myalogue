import React, { Component } from 'react';
import Util from '../../../Util';
import { Redirect } from 'react-router-dom';

import Timer from '../../UI/Timer/Timer';
import ComicPanel from '../../UI/ComicPanel/ComicPanel';
import Button from '../../UI/Button/Button';
import S4YButton from '../../UI/S4YButton/S4YButton';

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
			dialogue: ''
		});
	}
	playNew() {
		this.resetPlayData();
		this.setState({
			isLoading: true
		});

		Util.api.post('/api/play', {
			token: this.props.token //optional
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					comicId: result.comicId,
					templatePanelId: result.templatePanelId,
					currentComicPanel: result.currentComicPanel, //May be null
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
		let dialogue = this.state.dialogue;

		this.setState({
			isLoading: true
		});

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
			this.resetPlayData();
		});
	}
	render() {
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
				{this.state.currentComicPanel
					? <h5 className="center">Continue the story in the comic</h5>
					: <h5 className="center">Begin the story for the comic</h5>
				}
				<Timer autoStart={{ minutes: playTimerMins, seconds: 0 }} onComplete={this.resetPlayData} />
				<div className="comic-panels">
					{this.state.currentComicPanel
						? <ComicPanel comicPanel={this.state.currentComicPanel} />
						: null
					}
					<ComicPanel onDialogueChange={this.onDialogueChange} templatePanelId={this.state.templatePanelId} />
				</div>
				<div className="button-container justify-center">
					<Button onClick={() => this.submitComicPanel(this.state.dialogue)} className={this.state.dialogue ? '' : 'disabled'} colour="pink" label="I'm done!" size="lg" />
				</div>
				<div className="button-container justify-center">
					<Button onClick={this.playNew} colour="black" label="Skip" isHollow={true} />
				</div>
			</div>;
		} else {
			//Not submitted, not in progress, must have ran out of time
			content = <div className="play-area">
				{this.state.isSubmitted 
					 ?<div>
						<h2>Panel created!</h2>
						{this.state.completedComicId
							? <p className="center">Your panel was created and the comic has been completed! You can now view the whole comic.</p>
							: <p className="center">Your panel was created. You'll get a notification when the completed comic is ready.</p>
						}
						{this.state.completedComicId
							? <div className="button-container justify-center">
								<Button to={Util.route.comic(this.state.completedComicId)} label="View comic" colour="black" size="lg" />
							</div>
							: null
						}
						<div className="button-container justify-center">
							<S4YButton label="Play again" onClick={this.playNew} size="lg" />
						</div>
					</div>				
					: <div>
						<h2>Sorry, you ran out of time!</h2>
						<p className="center">Each time you play, you only have <b>{playTimerMins} minutes</b> to complete your panel.</p>
						<p className="center">Why not have another crack?</p>
						<div className="button-container justify-center">
							<S4YButton label="Try again" onClick={this.playNew} size="lg" />				
						</div>
					</div>
				}
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
			{/* <div className="panel-inset">
				<div className="container">
					<div className="row">
						<h3>Tips</h3>
						<ul>
							<li>Pay attention to the previous panel, don't just something random (unless you're the first dialogue, in which case just go nuts).</li>
							<li>Don't overthink it!</li>
						</ul>
					</div>
				</div>
			</div> */}
		</div>;
	}
}