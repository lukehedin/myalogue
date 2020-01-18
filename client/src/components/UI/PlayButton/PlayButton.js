import React, { Component } from 'react';
import Util from '../../../Util';

import Button from '../Button/Button';

export default class PlayButton extends Component {
	constructor(props) {
		super(props);
		
		if(Util.context.isAuthenticated()) {
			let templateId = this.props.templateId;
			let groupId = this.props.groupId;
			let groupChallengeId = this.props.groupChallengeId;

			if(this.props.useQueryParams) {
				let urlParams = new URLSearchParams(window.location.search);
				templateId = urlParams.get('pTemplateId');
				groupId = urlParams.get('pGroupId');
				groupChallengeId = urlParams.get('pGroupChallengeId');
			}

			this.state = {
				templateId,
				groupId,
				groupChallengeId
			};
		} else {
			//Empty state for non logged in users
			this.state = {};
		}

		this.clearPlayOptions = this.clearPlayOptions.bind(this);
	}
	getSnapshotBeforeUpdate(prevProps) {
		let playOptionsChanged = (this.props.templateId && this.props.templateId !== prevProps.templateId)
			|| (this.props.groupId && this.props.groupId !== prevProps.groupId)
			|| (this.props.groupChallengeId && this.props.groupChallengeId !== prevProps.groupChallengeId);

		return !!playOptionsChanged;
	}
	componentDidUpdate(prevProps, prevState, isNewOptions) {
		if(isNewOptions && Util.context.isAuthenticated()) {
			this.setState({
				templateId: this.props.templateId,
				groupId: this.props.groupId,
				groupChallengeId: this.props.groupChallengeId
			});
		}
	}
	clearPlayOptions() {
		this.setState({
			templateId: null,
			groupId: null,
			groupChallengeId: null
		});
	
		if(this.props.onClearOptions) this.props.onClearOptions();
	}
	render() {
		let template = !isNaN(parseInt(this.state.templateId))
			? Util.context.getTemplateById(parseInt(this.state.templateId))
			: null;
			
		let groupUser = !isNaN(parseInt(this.state.groupId))
			? Util.context.getGroupUserByGroupId(parseInt(this.state.groupId))
			: null;
		
		let queryParams = {};
		if(this.state.templateId) queryParams.pTemplateId = this.state.templateId;
		if(this.state.groupId) queryParams.pGroupId = this.state.groupId;
		if(this.state.groupChallengeId) queryParams.pGroupChallengeId = this.state.groupChallengeId;

		let to = Util.route.withQueryParams(Util.route.play(), queryParams);
		
		return <div className="play-button">
			<Button onClick={this.props.onClick} className="play-button-button" size="lg" colour="pink" to={to}>
				<p className="play-button-title">{this.props.title || 'Play'}</p>
				{template ? <p className="play-button-sub">using <b>{template.name}</b></p> : null}
				{groupUser ? <p className="play-button-sub">with <b>{groupUser.groupName || 'group'}</b></p> : null}
				{this.state.groupChallengeId ? <p className="play-button-sub">(with a challenge)</p> : null}
			</Button>
			{this.props.allowClearOptions && (template || groupUser || this.state.groupChallengeId)
				? <a className="play-button-clear" onClick={this.clearPlayOptions}>Switch to regular play</a>
				: null
			}
		</div>
	}
}