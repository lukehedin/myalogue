import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openModal } from '../../../redux/actions';
import Textarea from 'react-textarea-autosize';
import htmlToImage from 'html-to-image';
import Util from '../../../Util';

import frame from './frame.png';

import Button from '../Button/Button';
import ComicVote from '../ComicVote/ComicVote';
import ReactSVG from 'react-svg';

//this.props.template + this.props.comic (optional)
class Comic extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: false,
			isEditing: false,
			isShareOverlayVisible: false,
			
			comic: this.props.comic || this.getBlankComicObject(),

			invalidTemplateDialogueIds: []
		}

		this.comicRef = React.createRef();
		this.textareaRefs = {};

		this.toImage = this.toImage.bind(this);
		this.onDialogueBoxClick = this.onDialogueBoxClick.bind(this);
		this.setIsShareOverlayVisible = this.setIsShareOverlayVisible.bind(this);
		this.setIsEditing = this.setIsEditing.bind(this);
		this.setComicDialogueValue = this.setComicDialogueValue.bind(this);
		this.submitComic = this.submitComic.bind(this);
		this.getBlankComicObject = this.getBlankComicObject.bind(this);
	}
	getBlankComicObject() {
		return {
			name: this.props.template.name,
			userId: Util.auth.getUserId(),
			username: Util.auth.getUsername(),
			templateId: this.props.template.templateId,
			comicDialogues: this.props.template.templateDialogues.map(td => {
				return {
					templateDialogueId: td.templateDialogueId,
					value: ''
				};
			})
		};
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

		if(isEditing) {
			setTimeout(() => {
				if(this.textareaRefs && this.textareaRefs[0]) {
					this.textareaRefs[0].focus();
				}
			}, 200);
		}
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
				this.setState({
					isLoading: true
				});

				Util.api.post('/api/submitComic', {
					comic: this.state.comic
				})
				.then(result => {
					if(!result.error) {
						this.props.openModal({
							type: Util.enum.ModalType.Alert,
							content: <div>
								<p>Your comic (#{this.props.template.ordinal}-{result.comic.comicId}) was submitted successfully.</p>
							</div>
						});

						this.setState({
							isLoading: false,
							isEditing: false,
							comic: this.getBlankComicObject()
						})
					}
				});
			}

			//TODO confirm modal if not logged in
			if(!Util.auth.isAuthenticated()){
				this.props.openModal({
					type: Util.enum.ModalType.Confirm,
					yesLabel: 'Yes. Submit my comic anonymously.',
					yesFn: submitComicAction,
					noLabel: 'No. I will log in or register first.',
					content: <div>
						<p>You aren't currently logged in. If you submit this comic, it will be submitted anonymously and you will never be able to claim ownership of it.</p>
						<p>Do you want to submit this comic anonymously?</p>
					</div>
				});
			} else {
				submitComicAction();
			}
		}
	}
	render(){
		let isComicViewOnly = this.state.comic.comicId;

		return <div className="comic">
			{this.state.isLoading ? <div className="loader"></div> : null}
			<div className="comic-inner" ref={this.comicRef}>
				<img className="comic-template" src={this.props.template.imageUrl} />
				<img className="comic-frame" src={frame} />
				{this.props.template.templateDialogues.map((templateDialogue, idx) => {
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
							? <Textarea 
								inputRef={ref => this.textareaRefs[idx] = ref}
								maxLength={255} 
								tabIndex={templateDialogue.ordinal} 
								value={comicDialogueValue} 
								onChange={(e) => this.setComicDialogueValue(templateDialogue.templateDialogueId, e.target.value)}
							/>
							: <div>{comicDialogueValue}</div>
						}
					</div>
				})}
				<div className="comic-footer">
					<div className="comic-footer-inner">
						<div>www.s4ycomic.com</div>
						<div className="flex-spacer"></div>
						<div>
							<span>#{this.props.template.ordinal}</span>
							<span>-{this.state.comic.comicId ? `${this.state.comic.comicId}` : '_'}</span>
							<span> by {this.state.comic.username}</span>
						</div>
					</div>
				</div>
				{!this.state.isEditing && !isComicViewOnly
					? <div className="begin-edit-overlay" >
						<Button size="lg" colour="pink" label="Speak 4 Yourself" onClick={() => this.setIsEditing(true)} />
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
			<div className="comic-lower">
				{this.state.isEditing
					? <div className="edit-toolbar">
						<Button colour="pink" label="I'm done!" onClick={this.submitComic} />
					</div>
					: null
				}
				{isComicViewOnly
					? <div className="">
						<ComicVote comicId={this.state.comic.comicId} defaultRating={this.state.comic.rating} defaultValue={this.state.comic.voteValue} />
					</div>
					: null
				}
			</div>
		</div>
	}
}

export default connect(null, { openModal })(Comic);