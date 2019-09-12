import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openModal } from '../../../redux/actions';
import Textarea from 'react-textarea-autosize';
import htmlToImage from 'html-to-image';

import frame from './frame.png';

import Button from '../Button/Button';
import Util from '../../../Util';

//this.props.template + this.props.comic (optional)
class Comic extends Component {
	constructor(props){
		super(props);

		this.state = {
			isEditing: false,
			isShareOverlayVisible: false,
			
			comic: this.props.comic || {
				name: this.props.template.name,
				templateId: this.props.templateId,
				comicDialogues: this.props.template.templateDialogues.map(td => {
					return {
						templateDialogueId: td.templateDialogueId,
						value: ''
					};
				})
			},

			invalidTemplateDialogueIds: []
		}

		this.comicRef = React.createRef();

		this.toImage = this.toImage.bind(this);
		this.onDialogueBoxClick = this.onDialogueBoxClick.bind(this);
		this.setIsShareOverlayVisible = this.setIsShareOverlayVisible.bind(this);
		this.setIsEditing = this.setIsEditing.bind(this);
		this.setComicDialogueValue = this.setComicDialogueValue.bind(this);
		this.submitComic = this.submitComic.bind(this);
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
			},
			invalidTemplateDialogueIds: this.state.invalidTemplateDialogueIds.filter(invalidTemplateDialogueId => invalidTemplateDialogueId !== templateDialogueId)
		});
	}
	setIsEditing(isEditing) {
		this.setState({
			isEditing
		});
	}
	setIsShareOverlayVisible(isShareOverlayVisible){
		this.setState({
			isShareOverlayVisible
		});
	}
	onDialogueBoxClick(e) {
		if(e.target.classList.contains('dialogue')) {
			e.target.firstElementChild.focus();
		}
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
	submitComic() {
		let invalidTemplateDialogueIds = [];

		this.props.template.templateDialogues.forEach(td => {
			let comicDialogue = this.state.comic.comicDialogues.find(cd => cd.templateDialogueId === td.templateDialogueId);
			if(!comicDialogue || !comicDialogue.value) invalidTemplateDialogueIds.push(td.templateDialogueId);
		});

		if(Util.array.any(invalidTemplateDialogueIds)) {
			this.setState({
				invalidTemplateDialogueIds
			});
		} else {
			let submitComicAction = () => {
				Util.api.post('/api/submitComic', {
					comic: this.state.comic
				})
				.then(result => {

				});
			}

			//TODO confirm modal if not logged in
			if(!Util.auth.getUserId()){
				this.props.openModal({
					type: Util.enum.ModalType.Confirm,
					yesLabel: 'Yes, I will submit my comic anonymously.',
					yesFn: submitComicAction,
					noLabel: 'No, I want to sign up first!',
					content: <div>
						<p>You aren't currently logged in. If you submit this comic, it will be submitted anonymously and you will never be able to claim ownership of it.</p>
						<p>Are you sure you want to submit this comic anonymously?</p>
					</div>
				});
			} else {
				submitComicAction();
			}
		}
	}
	render(){
		let isComicViewOnly = this.state.comic.comicId;

		return <div className="comic" ref={this.comicRef}>
			<div className="comic-inner">
				<img className="comic-template" src={this.props.template.imageUrl} />
				<img className="comic-frame" src={frame} />
				{this.props.template.templateDialogues.map(templateDialogue => {
					let comicDialogue = this.state.comic.comicDialogues.find(cd => cd.templateDialogueId === templateDialogue.templateDialogueId);
					let comicDialogueValue = comicDialogue ? comicDialogue.value : '';

					const baseComicSize = 1080;

					let percentPositionX = (templateDialogue.positionX / baseComicSize) * 100;
					let percentPositionY = (templateDialogue.positionY / baseComicSize) * 100;
					let percentSizeX = (templateDialogue.sizeX / baseComicSize) * 100;
					let percentSizeY = (templateDialogue.sizeY / baseComicSize) * 100;

					let isInvalid = this.state.isEditing && this.state.invalidTemplateDialogueIds.includes(templateDialogue.templateDialogueId);

					return <div 
						className={`dialogue ${this.state.isEditing && !comicDialogueValue  ? 'edit-empty' : ''} ${isInvalid ? 'edit-invalid' : ''}`}
						onClick={this.state.isEditing ? this.onDialogueBoxClick : null}
						key={templateDialogue.templateDialogueId}
						style={{ 
							left: `${percentPositionX}%`, 
							top: `${percentPositionY}%`,
							width: `${percentSizeX}%`,
							height: `${percentSizeY}%`
						}} >
						{this.state.isEditing
							? <Textarea maxLength={255} tabIndex={templateDialogue.ordinal} value={comicDialogueValue} onChange={(e) => this.setComicDialogueValue(templateDialogue.templateDialogueId, e.target.value)} />
							: <div>{comicDialogueValue}</div>
						}
					</div>
				})}
				<div className="comic-footer">
					<div>{this.props.template.ordinal} {this.props.template.name}</div>
					<div className="flex-spacer"></div>
					<div></div>
				</div>
				{!this.state.isEditing && !isComicViewOnly
					? <div className="begin-edit-overlay" >
						<Button size="lg" label="Speak 4 Yourself" onClick={() => this.setIsEditing(true)} />
					</div>
					: null
				}
				{isComicViewOnly
					? <div className={`share-overlay ${this.state.isShareOverlayVisible ? '' : 'invisible'}`} 
						onTouchStart={() => this.setIsShareOverlayVisible(true)}
						onMouseDown={() => this.setIsShareOverlayVisible(true)}
						>
						<Button label="Share" onClick={this.toImage} />
					</div>
					: null
				}
			</div>
			<div className="row">
				{this.state.isEditing
					? <Button label="I'm done!" onClick={this.submitComic} />
					: null
				}
				{isComicViewOnly
					? <div className="comic-vote">
						<p>Did you like this comic?</p>
						<div className="flex-spacer"></div>
						<div className="vote-thumb">👍</div>
						<div className="vote-thumb">👎</div>
					</div>
					: null
				}
			</div>
		</div>
	}
}

export default connect(null, { openModal })(Comic);