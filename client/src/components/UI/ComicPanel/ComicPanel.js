import React, { Component } from 'react';
import Textarea from 'react-textarea-autosize';
import Util from '../../../Util';

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
		let isEditing = !this.props.comicPanel && !this.props.readOnly;
		let isMyPanel = Util.context.isAuthenticated() && this.props.comicPanel && this.props.comicPanel.user && this.props.comicPanel.user.userId === Util.context.getUserId();
		let templatePanel = Util.referenceData.getTemplatePanelById(this.props.comicPanel ? this.props.comicPanel.templatePanelId : this.props.templatePanelId);
		
		const basePanelWidth = 540;
		const basePanelHeight = 450;

		let percentPositionX = (templatePanel.positionX / basePanelWidth) * 100;
		let percentPositionY = (templatePanel.positionY / basePanelHeight) * 100;
		let percentSizeX = (templatePanel.sizeX / basePanelWidth) * 100;
		let percentSizeY = (templatePanel.sizeY / basePanelHeight) * 100;
		
		return <div className={`comic-panel ${isEditing ? 'editing' : ''}`} onClick={isEditing ? this.focusTextarea : null}>
			<img className="comic-panel-image" alt="" onContextMenu={Util.event.absorb} src={this.props.isColour ? templatePanel.imageColour : templatePanel.image} />
			<div className={`dialogue 
					${this.props.comicPanel && this.props.comicPanel.isCensored ? 'censored' : ''}
					${isEditing && !this.state.dialogue ? 'edit-empty' : ''}
					text-colour-${Util.enums.toString(Util.enums.TextColour, templatePanel.textColour || Util.enums.TextColour.Black).toLowerCase()}
					text-align-horizontal-${Util.enums.toString(Util.enums.TextAlignHorizontal, templatePanel.textAlignHorizontal || Util.enums.TextAlignHorizontal.Middle).toLowerCase()}
					text-align-vertical-${Util.enums.toString(Util.enums.TextAlignVertical, templatePanel.textAlignVertical || Util.enums.TextAlignVertical.Bottom).toLowerCase()}
				`}
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
			{!isEditing && this.props.includeComicId
				? <div className="comic-panel-id comic-panel-subtle">Comic #{this.props.comicPanel.comicId} {Util.route.getHost()}</div> 
				: null
			}
			{!isEditing && this.props.comicPanel && this.props.comicPanel.user 
				? <div className={`comic-panel-subtle comic-panel-author ${isMyPanel ? 'me': ''}`}>{this.props.comicPanel.user.username}</div> 
				: null
			}
		</div>
	}
}