import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openModal } from '../../../redux/actions';
import htmlToImage from 'html-to-image';
import Util from '../../../Util';

import ComicPanel from '../ComicPanel/ComicPanel';
import ComicVote from '../ComicVote/ComicVote';
import ComicTitle from '../ComicTitle/ComicTitle';

//this.props.comic
class Comic extends Component {
	constructor(props){
		super(props);

		this.initialComic = this.props.comic;
		this.template = Util.context.getTemplateById(this.props.comic.templateId);

		this.state = {
			isLoading: false,
			
			comic: this.props.comic
		}

		this.comicContentRef = React.createRef();
		this.touchTimer = null;

		this.openShareComicModal  = this.openShareComicModal.bind(this);

		this.startShareTimeout = this.startShareTimeout.bind(this);
		this.cancelShareTimeout = this.cancelShareTimeout.bind(this);
	}
	startShareTimeout(e) {
		if(!this.isLoading) this.touchTimer = setTimeout(() => this.openShareComicModal(), 500);
		Util.selector.getRootScrollElement().addEventListener('scroll', this.cancelShareTimeout);
	}
	cancelShareTimeout() {
		if(this.touchTimer) clearTimeout(this.touchTimer);

		Util.selector.getRootScrollElement().removeEventListener('scroll', this.cancelShareTimeout);
	}
	openShareComicModal(callback){
		if(this.state.isLoading) return;
		console.log('opening');
		
		this.setState({
			isLoading: true
		});

		let comicContent = this.comicContentRef.current;
		let clone = comicContent.cloneNode(true);
		clone.classList.add('for-image-capture');
		comicContent.appendChild(clone);

		//Might be paranoid, but lets give the dom time to update
		setTimeout(() => {
			htmlToImage.toJpeg(clone)
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

					if(callback) callback();
				})
				.catch((error) => {
					console.error('Could not generate comic image', error);
				});
		}, 100);
	}
	render() {
		//Put comic panels into pairs
		let comicPanelsPaired = [];
		let heldPanel = null;
		this.state.comic.comicPanels.forEach((comicPanel, idx) => {
			if(idx % 2 === 0) {
				heldPanel = <ComicPanel comicPanel={comicPanel} />;
			} else {
				comicPanelsPaired.push(<div key={idx} className="paired-comic-panels">
					{heldPanel}
					<ComicPanel comicPanel={comicPanel} />
				</div>);
				heldPanel = null;
			}
		});

		return <div className="comic">
			{this.state.isLoading ? <div className="loader masked"></div> : null}
			<div className="comic-content no-select"
				ref={this.comicContentRef}
				onTouchStart={() => this.startShareTimeout()}
				onTouchEnd={() => this.cancelShareTimeout()}
				onMouseDown={() => this.openShareComicModal()}
			>
				{comicPanelsPaired.map(comicPanelPair => comicPanelPair)}
			</div>
			<div className="comic-lower">
				<div className="comic-lower-inner">
					<div className="flex-spacer"></div>
					<ComicVote comicId={this.state.comic.comicId} defaultRating={this.state.comic.rating} defaultValue={this.state.comic.voteValue} />
				</div>
			</div>
		</div>
	}
}

export default connect(null, { openModal })(Comic);