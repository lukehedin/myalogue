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

//this.props.gameId AND/OR this.props.comic (optional)
class Comic extends Component {
	constructor(props){
		super(props);

		this.game = Util.context.getGameById(this.props.gameId || this.props.comic.gameId);

		this.state = {
			isLoading: false,
			isEditing: false,
			
			comic: this.props.comic || this.getBlankComicObject(),

			invalidGameDialogueIds: []
		}

		this.comicContentRef = React.createRef();
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
			title: this.game.title,
			userId: Util.context.getUserId(),
			username: Util.context.getUsername(),
			gameId: this.game.gameId,
			comicDialogues: this.game.gameDialogues.map(td => {
				return {
					gameDialogueId: td.gameDialogueId,
					value: ''
				};
			})
		};
	}
	setComicDialogueValue(gameDialogueId, value) {
		this.setState({
			comic: {
				...this.state.comic,
				comicDialogues: this.state.comic.comicDialogues.map(cd => {
					return cd.gameDialogueId === gameDialogueId
						? {
							...cd,
							gameDialogueId: gameDialogueId,
							value: value
						}
						: cd
				})
			},
			invalidGameDialogueIds: this.state.invalidGameDialogueIds.filter(invalidGameDialogueId => invalidGameDialogueId !== gameDialogueId)
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

		let comicContent = this.comicContentRef.current;
		let clone = comicContent.cloneNode(true);
		clone.classList.add('for-image-capture');
		comicContent.appendChild(clone);

		//Might be paranoid, but lets give the dom time to update
		setTimeout(() => {
			htmlToImage.toPng(clone)
				.then(dataUrl => {
					comicContent.removeChild(clone);

					this.setState({
						isLoading: false
					});

					this.props.openModal({
						type: Util.enum.ModalType.ShareComicModal,
						comicDataUrl: dataUrl,
						comic: this.state.comic
					});
				})
				.catch((error) => {
					console.error('Could not generate comic image', error);
				});
		}, 100);
	}
	submitComic() {
		let invalidGameDialogueIds = [];

		this.game.gameDialogues.forEach(td => {
			let comicDialogue = this.state.comic.comicDialogues.find(cd => cd.gameDialogueId === td.gameDialogueId);
			if(!comicDialogue || !comicDialogue.value) invalidGameDialogueIds.push(td.gameDialogueId);
		});

		if(Util.array.any(invalidGameDialogueIds)) {
			this.setState({
				invalidGameDialogueIds
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
			<div className={`comic-content ${isComicViewOnly ? 'view-only no-select' : ''}`} 
				ref={this.comicContentRef}
				onTouchStart={isComicViewOnly ? this.startShareTimeout : null}
				onTouchEnd={isComicViewOnly ? this.cancelShareTimeout : null}
				onMouseDown={isComicViewOnly ? this.openShareComicModal : null}
			>
				<img alt="" onContextMenu={Util.event.absorb} className="comic-game" src={this.game.imageUrl} />
				<img alt="" onContextMenu={Util.event.absorb} className="comic-frame" src={frame} />
				{this.game.gameDialogues.map((gameDialogue, idx) => {
					let comicDialogue = this.state.comic.comicDialogues.find(cd => cd.gameDialogueId === gameDialogue.gameDialogueId);
					let comicDialogueValue = comicDialogue ? comicDialogue.value : '';

					const baseComicSize = 1080;

					let percentPositionX = (gameDialogue.positionX / baseComicSize) * 100;
					let percentPositionY = (gameDialogue.positionY / baseComicSize) * 100;
					let percentSizeX = (gameDialogue.sizeX / baseComicSize) * 100;
					let percentSizeY = (gameDialogue.sizeY / baseComicSize) * 100;

					let isInvalid = this.state.isEditing && this.state.invalidGameDialogueIds.includes(gameDialogue.gameDialogueId);

					lastTabIndex = gameDialogue.ordinal;

					return <div 
						className={`dialogue ${this.state.isEditing && !comicDialogueValue  ? 'edit-empty' : ''} ${isInvalid ? 'edit-invalid' : ''}`}
						onClick={this.state.isEditing ? this.onDialogueBoxClick : null}
						key={gameDialogue.gameDialogueId}
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
								tabIndex={gameDialogue.ordinal} 
								value={comicDialogueValue} 
								onChange={(e) => this.setComicDialogueValue(gameDialogue.gameDialogueId, e.target.value)}
							/>
							: <div>{comicDialogueValue}</div>
						}
					</div>
				})}
				<div className="comic-footer-container">
					<div className="comic-footer">
						<div className="comic-footer-top">
							<div className="footer-left">{isComicViewOnly ? <ComicTitle isFakeLink={true} comic={this.state.comic} /> : `Game ${this.game.gameId}`}</div>
							<div className="flex-spacer">&nbsp;&nbsp;</div>
							<div className="footer-right">Speak 4 Yourself</div>
						</div>
						<div className="comic-footer-bottom">
							<div className="footer-left">{Util.route.host}{Util.route.game(this.game.gameId, this.state.comic.comicId)}</div>
							<div className="flex-spacer">&nbsp;&nbsp;</div>
							<div className="footer-right">@imdoodlir</div>
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