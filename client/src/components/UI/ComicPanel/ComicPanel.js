import React, { Component } from 'react';
import Textarea from 'react-textarea-autosize';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import Button from '../Button/Button';

//this.props.templateId, this.props.comicPanel (editing if not present)
export default class ComicPanel extends Component {
	constructor(props) {
		super(props);

		this.template = Util.context.getTemplateById(this.props.templateId);

		this.state = {
			dialogue: this.props.comicPanel
				? this.props.comicPanel.value
				: '',
			templatePanelId: this.props.comicPanel 
				? this.props.comicPanel.templatePanelId
				: Util.array.random(this.template.templatePanels).templatePanelId
		};
		
		this.onDialogueBoxClick = this.onDialogueBoxClick.bind(this);
		this.setDialogue = this.setDialogue.bind(this);
	}
	setDialogue(value) {
		this.setState({
			dialogue: value
		});
	}
	onDialogueBoxClick(e) {
		if(e.target.classList.contains('dialogue')) e.target.firstElementChild.focus();
	}
	render() {
		let templatePanel = this.template.templatePanels.find(templatePanel => templatePanel.templatePanelId === this.state.templatePanelId);

		const basePanelWidth = 540;
		const basePanelHeight = 450;

		let percentPositionX = (templatePanel.positionX / basePanelWidth) * 100;
		let percentPositionY = (templatePanel.positionY / basePanelHeight) * 100;
		let percentSizeX = (templatePanel.sizeX / basePanelWidth) * 100;
		let percentSizeY = (templatePanel.sizeY / basePanelHeight) * 100;
		
		return <div className='comic-panel'>
				<div className='comic-panel-content'>
					<img className="comic-panel-image" alt="" onContextMenu={Util.event.absorb} src={templatePanel.image} />
					<div className={`dialogue ${this.props.isEditing && !this.state.dialogue ? 'edit-empty' : ''}`}
						onClick={this.props.isEditing ? this.onDialogueBoxClick : null}
						style={{ 
							left: `${percentPositionX}%`, 
							top: `${percentPositionY}%`,
							width: `${percentSizeX}%`,
							height: `${percentSizeY}%`
						}} >
						{this.props.isEditing
							? <Textarea
								maxLength={255}
								value={this.state.dialogue} 
								onChange={(e) => this.setDialogue(e.target.value)}
							/>
							: <div>{this.state.dialogue}</div>
						}
					</div>
				</div>
				<Button className={this.state.dialogue ? '' : 'disabled'} colour="pink" label="I'm done!" size="lg" />
			</div>
	}
}