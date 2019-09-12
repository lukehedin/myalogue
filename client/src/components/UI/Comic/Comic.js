import React, { Component } from 'react';
import Textarea from 'react-textarea-autosize';
import htmlToImage from 'html-to-image';

import frame from './frame.png';

import Button from '../Button/Button';

//this.props.template + this.props.comic (optional)
export default class Comic extends Component {
	constructor(props){
		super(props);

		this.state = {
			isEditing: true,
			isOverlayVisible: false,
			comic: this.props.comic || {
				name: this.props.template.name,
				comicDialogues: this.props.template.templateDialogues.map(td => {
					return {
						templateDialogueId: td.templateDialogueId,
						value: ''
					};
				})
			}
		}

		this.comicRef = React.createRef();

		this.toImage = this.toImage.bind(this);
		this.setIsOverlayVisible = this.setIsOverlayVisible.bind(this);
		this.setComicDialogueValue = this.setComicDialogueValue.bind(this);
	}
	setComicDialogueValue(templateDialogueId, value) {
		this.setState({
			comic: {
				...this.state.comic,
				comicDialogues: this.state.comic.comicDialogues.map(cd => {
					return cd.templateDialogueId === templateDialogueId
						? {
							...cd,
							templateDialogueId: templateDialogueId,
							value: value
						}
						: cd
				})
			}
		});
	}
	setIsOverlayVisible(isOverlayVisible){
		this.setState({
			isOverlayVisible: isOverlayVisible
		});
	}
	toImage(){
		let comic = this.comicRef.current;
		htmlToImage.toPng(comic)
			.then(function (dataUrl) {
				var img = new Image();
				img.src = dataUrl;
				document.body.appendChild(img);
			})
			.catch(function (error) {
				console.error('oops, something went wrong!', error);
			});
	}
	render(){
		return <div className="comic" ref={this.comicRef}>
			<div className="comic-inner">
				<img className="comic-template" src={this.props.template.imageUrl} />
				<img className="comic-frame" src={frame} />
				<div className="testy">what up</div>
				<input defaultValue="bobby" />
				{this.props.template.templateDialogues.map(templateDialogue => {
					let comicDialogue = this.state.comic.comicDialogues.find(cd => cd.templateDialogueId === templateDialogue.templateDialogueId);
					let comicDialogueValue = comicDialogue ? comicDialogue.value : '';

					const baseComicSize = 1080;

					let percentPositionX = (templateDialogue.positionX / baseComicSize) * 100;
					let percentPositionY = (templateDialogue.positionY / baseComicSize) * 100;
					let percentSizeX = (templateDialogue.sizeX / baseComicSize) * 100;
					let percentSizeY = (templateDialogue.sizeY / baseComicSize) * 100;

					return <div className={`dialogue ${!comicDialogueValue ? 'empty' : ''}`} key={templateDialogue.templateDialogueId} style={{ 
							left: `${percentPositionX}%`, 
							top: `${percentPositionY}%`,
							width: `${percentSizeX}%`,
							height: `${percentSizeY}%`
						}} >
						{this.state.isEditing
							? <Textarea placeholder={templateDialogue.placeholder || 'Make me say something!'} value={comicDialogueValue} onChange={(e) => this.setComicDialogueValue(templateDialogue.templateDialogueId, e.target.value)} />
							: <div>{comicDialogueValue}</div>
						}
					</div>
				})}
				<div className="comic-footer">
					<div>{this.props.template.ordinal}</div>
				</div>
			</div>
			{!this.state.isEditing
				? <div className={`comic-overlay ${this.state.isOverlayVisible ? '' : 'invisible'}`} onClick={() => this.setIsOverlayVisible(!this.state.isOverlayVisible)}>
					<Button label="Share" onClick={this.toImage} />
				</div>
				: null
			}
		</div>
	}
}