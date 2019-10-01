import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openModal } from '../../../redux/actions';
import moment from 'moment';
import Util from '../../../Util';

import ComicPanel from '../ComicPanel/ComicPanel';
import ComicPanelPair from '../ComicPanelPair/ComicPanelPair';
import ComicVote from '../ComicVote/ComicVote';

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
	openShareComicModal(){
		this.props.openModal({
			type: Util.enum.ModalType.ShareComicModal,
			comic: this.state.comic
		});
	}
	render() {
		//Put comic panels into pairs
		let comicPanelsPairs = [];
		let heldPanel = null;
		this.state.comic.comicPanels.forEach((comicPanel, idx) => {
			if(idx % 2 === 0) {
				heldPanel = <ComicPanel comicPanel={comicPanel} includeComicId={idx === 0} />;
			} else {
				comicPanelsPairs.push(<ComicPanelPair key={idx}>
					{heldPanel}
					<ComicPanel comicPanel={comicPanel} />
				</ComicPanelPair>);
				heldPanel = null;
			}
		});

		return <div className="comic">
			<div className="comic-content no-select"
				ref={this.comicContentRef}
				onTouchStart={() => this.startShareTimeout()}
				onTouchEnd={() => this.cancelShareTimeout()}
				onMouseDown={() => this.openShareComicModal()}
			>
				{comicPanelsPairs.map(comicPanelPair => comicPanelPair)}
				{this.state.isLoading ? <div className="loader masked"></div> : null}
			</div>
			<div className="comic-lower">
				<div className="comic-lower-inner">
					<p className="comic-completed-at sm">{moment(this.state.comic.completedAt).fromNow()}</p>
					<div className="flex-spacer"></div>
					<ComicVote comicId={this.state.comic.comicId} defaultRating={this.state.comic.rating} defaultValue={this.state.comic.voteValue} />
				</div>
			</div>
		</div>
	}
}

export default connect(null, { openModal })(Comic);