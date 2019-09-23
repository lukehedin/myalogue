import React, { Component } from 'react';
import Util from '../../../Util';
import { Redirect } from 'react-router-dom';

import Timer from '../../UI/Timer/Timer';
import ComicPanel from '../../UI/ComicPanel/ComicPanel';
import Button from '../../UI/Button/Button';

export default class PlayPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			error: null,

			comic: null
		};
	}
	componentDidMount() {
		this.fetchData();
	}
	fetchData() {
		this.setState({
			isLoading: true
		});

		Util.api.post('/api/play', {
			templateId: this.props.templateId,
			token: this.props.token //optional
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					templateId: result.templateId || Util.array.random(Util.context.getTemplates()).templateId,
					currentPanel: result.currentPanel, //May be null
					comicId: result.comicId // May be null
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
		return <div className="page-play">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h2>Speak 4 Yourself</h2>
						{!this.state.isLoading ? <Timer autoStart={{ minutes: 0, seconds: 10 }} /> : null}
						<div className="play-area">
							{this.state.isLoading
								? <div className="loader"></div>
								: this.state.error
									? <p className="empty-text">{this.state.error}</p>
									: <div>
										{this.state.comicPanel
											? <div>
												<p>Continue the story in the comic. This is the current panel:</p>
												<ComicPanel comicPanel={this.state.comicPanel} />
											</div>
											: <div>
												<p>You are starting the story for this comic. Go nuts!</p>
											</div>
										}
										<ComicPanel isEditing={true} templateId={this.state.templateId} />
									</div>
							}
						</div>
					</div>
				</div>
			</div>
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<h3>Tips</h3>
						<ul>
							<li>Pay attention to the previous panel, don't just something random (unless you're the first dialogue, in which case just go nuts).</li>
							<li>Don't overthink it!</li>
						</ul>
					</div>
				</div>
			</div>
		</div>;
	}
}