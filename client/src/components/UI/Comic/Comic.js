import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openModal } from '../../../redux/actions';
import Textarea from 'react-textarea-autosize';
import htmlToImage from 'html-to-image';
import Util from '../../../Util';

import frame from './frame.png';

import S4YButton from '../S4YButton/S4YButton';
import Button from '../Button/Button';
import ComicVote from '../ComicVote/ComicVote';
import ComicTitle from '../ComicTitle/ComicTitle';
import ProgressBar from '../ProgressBar/ProgressBar';

//this.props.template + this.props.comic (optional)
class Comic extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: false,
			isEditing: false,
			
			comic: this.props.comic || this.getBlankComicObject(),

			invalidTemplateDialogueIds: []
		}

		this.comicRef = React.createRef();
		this.textareaRefs = {};
		this.touchTimer = null;

		this.onDialogueBoxClick = this.onDialogueBoxClick.bind(this);
		this.setIsEditing = this.setIsEditing.bind(this);
		this.setComicDialogueValue = this.setComicDialogueValue.bind(this);
		this.submitComic = this.submitComic.bind(this);
		this.getBlankComicObject = this.getBlankComicObject.bind(this);
		this.openShareComicModal  = this.openShareComicModal.bind(this);

		this.startShareTimeout = this.startShareTimeout.bind(this);
		this.cancelShareTimeout = this.cancelShareTimeout.bind(this);
	}
	getBlankComicObject() {
		return {
			title: this.props.template.title,
			userId: Util.context.getUserId(),
			username: Util.context.getUsername(),
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
			isEditing,
			comic: this.getBlankComicObject()
		});

		if(isEditing) {
			setTimeout(() => {
				if(this.textareaRefs && this.textareaRefs[0]) {
					this.textareaRefs[0].focus();
				}
			}, 200);
		}
	}
	onDialogueBoxClick(e) {
		if(e.target.classList.contains('dialogue')) {
			e.target.firstElementChild.focus();
		}
	}
	startShareTimeout(e) {
		let isComicViewOnly = this.state.comic.comicId;
		if(isComicViewOnly) this.touchTimer = setTimeout(this.openShareComicModal, 500);

		Util.selector.getRootScrollElement().addEventListener('scroll', this.cancelShareTimeout);
	}
	cancelShareTimeout() {
		if(this.touchTimer) clearTimeout(this.touchTimer);
		
		Util.selector.getRootScrollElement().removeEventListener('scroll', this.cancelShareTimeout);
	}
	openShareComicModal(noUse){
		this.setState({
			isLoading: true
		});

		let comic = this.comicRef.current;

		htmlToImage.toPng(comic)
			.then(dataUrl => {
				this.setState({
					isLoading: false
				});

				this.props.openModal({
					type: Util.enum.ModalType.ShareComicModal,
					comicImageSrc: dataUrl,
					comic: this.state.comic
				});
			})
			.catch((error) => {
				console.error('Could not generate comic image', error);
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
			this.props.openModal({
				type: Util.enum.ModalType.SubmitComicModal,
				comic: this.state.comic,
				onSubmit: comic => {
					//Turn the comic into a readonly viewing one
					this.setState({
						comic: comic,
						isLoading: false,
						isEditing: false,
					}, this.openShareComicModal);
				}
			});
		}
	}
	render(){
		let isComicViewOnly = this.state.comic.comicId;
		let lastTabIndex = 0;

		return <div className="comic">
			{this.state.isLoading ? <div className="loader masked"></div> : null}
			<div className={`comic-inner ${isComicViewOnly ? 'view-only no-select' : ''}`} 
				ref={this.comicRef}
				onTouchStart={isComicViewOnly ? this.startShareTimeout : null}
				onTouchEnd={isComicViewOnly ? this.cancelShareTimeout : null}
				onMouseDown={isComicViewOnly ? this.openShareComicModal : null}
			>
				<img alt="" onContextMenu={Util.event.absorb} className="comic-template" src={this.props.template.imageUrl} />
				<img alt="" onContextMenu={Util.event.absorb} className="comic-frame" src={frame} />
				{this.props.template.templateDialogues.map((templateDialogue, idx) => {
					let comicDialogue = this.state.comic.comicDialogues.find(cd => cd.templateDialogueId === templateDialogue.templateDialogueId);
					let comicDialogueValue = comicDialogue ? comicDialogue.value : '';

					const baseComicSize = 1080;

					let percentPositionX = (templateDialogue.positionX / baseComicSize) * 100;
					let percentPositionY = (templateDialogue.positionY / baseComicSize) * 100;
					let percentSizeX = (templateDialogue.sizeX / baseComicSize) * 100;
					let percentSizeY = (templateDialogue.sizeY / baseComicSize) * 100;

					let isInvalid = this.state.isEditing && this.state.invalidTemplateDialogueIds.includes(templateDialogue.templateDialogueId);

					lastTabIndex = templateDialogue.ordinal;

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
				<div className="comic-footer-container">
					<div className="comic-footer">
						<div className="comic-footer-top">
							{isComicViewOnly ? <ComicTitle isFakeLink={true} comic={this.state.comic} /> : `Template ${this.props.template.templateId}`}
							<div className="flex-spacer"></div>
							<span>Speak 4 Yourself</span>
						</div>
						<div className="comic-footer-bottom">
							<span className="comic-link">{Util.route.root}{Util.route.template(this.props.template.templateId, this.state.comic.comicId)}</span>
							<div className="flex-spacer"></div>
							<span>@imdoodlir</span>
						</div>
					</div>
				</div>
				{!this.state.isEditing && !isComicViewOnly
					? <div className="begin-edit-overlay" >
						<S4YButton size="lg" onClick={() => this.setIsEditing(true)} />
					</div>
					: null
				}
			</div>
			<div className="comic-lower">
				{this.state.isEditing
					? <div className="edit-toolbar">
						<ProgressBar amount={this.state.comic.comicDialogues.filter(cd => !!cd.value).length} total={this.state.comic.comicDialogues.length} />
						<Button className={this.state.comic.comicDialogues.find(cd => !cd.value) ? 'disabled' : ''} tabIndex={lastTabIndex + 1} colour="pink" label="I'm done!" onClick={this.submitComic} />
					</div>
					: null
				}
				{isComicViewOnly
					? <div className="comic-lower-inner">
						<S4YButton onClick={() => this.setIsEditing(true)} />
						<div className="flex-spacer"></div>
						<Button className="share-button" isHollow={true} colour="pink" label="Share" leftIcon={Util.icon.share} onClick={this.openShareComicModal} />
						<ComicVote comicId={this.state.comic.comicId} defaultRating={this.state.comic.rating} defaultValue={this.state.comic.voteValue} />
					</div>
					: null
				}
			</div>
		</div>
	}
}

export default connect(null, { openModal })(Comic);