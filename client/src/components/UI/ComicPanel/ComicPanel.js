import React, { Component } from 'react';
import Textarea from 'react-textarea-autosize';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import Button from '../Button/Button';

//this.props.templateId, this.props.comicPanel (editing if not present)
export default class ComicPanel extends Component {
	constructor(props) {
		super(props);

		this.state = {
			dialogue: this.props.comicPanel 
				? this.props.comicPanel.value 
				: (this.props.dialogue || '')
		};

		this.textarea = null;

		this.focusTextarea = this.focusTextarea.bind(this);
		this.setDialogue = this.setDialogue.bind(this);
	}
	setDialogue(value) {
		this.setState({
			dialogue: value
		});

		if(this.props.onDialogueChange) this.props.onDialogueChange(value);
	}
	focusTextarea() {
		if(this.textarea) this.textarea.focus();
	}
	render() {
		let isEditing = !this.props.comicPanel;
		let templatePanel = Util.context.getTemplatePanelById(this.props.comicPanel ? this.props.comicPanel.templatePanelId : this.props.templatePanelId);
		
		const basePanelWidth = 540;
		const basePanelHeight = 450;

		let percentPositionX = (templatePanel.positionX / basePanelWidth) * 100;
		let percentPositionY = (templatePanel.positionY / basePanelHeight) * 100;
		let percentSizeX = (templatePanel.sizeX / basePanelWidth) * 100;
		let percentSizeY = (templatePanel.sizeY / basePanelHeight) * 100;
		
		return <div className={`comic-panel ${isEditing ? 'editing' : ''}`} onClick={isEditing ? this.focusTextarea : null}>
			<img className="comic-panel-image" alt="" onContextMenu={Util.event.absorb} src={templatePanel.image} />
			<div className={`dialogue ${isEditing && !this.state.dialogue ? 'edit-empty' : ''}`}
				style={{ 
					left: `${percentPositionX}%`, 
					top: `${percentPositionY}%`,
					width: `${percentSizeX}%`,
					height: `${percentSizeY}%`
				}} >
				{isEditing
					? <Textarea
						inputRef={tag => (this.textarea = tag)}
						maxLength={255}
						value={this.state.dialogue} 
						onChange={(e) => this.setDialogue(e.target.value)}
					/>
					: <div>{this.state.dialogue}</div>
				}
			</div>
			{!isEditing && this.props.includeSite
				? <div className="comic-panel-site comic-panel-subtle">{Util.route.getHost()}</div> 
				: null
			}
			{!isEditing && this.props.includeComicId
				? <div className="comic-panel-id comic-panel-subtle">#{this.props.comicPanel.comicId}</div> 
				: null
			}
			{!isEditing && this.props.comicPanel.username 
				? <div className="comic-panel-subtle comic-panel-author">{this.props.comicPanel.username}</div> 
				: null
			}
		</div>
	}
}