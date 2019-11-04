import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openModal } from '../../../redux/actions';
import moment from 'moment';
import Util from '../../../Util';

import Button from '../Button/Button';
import ComicPanel from '../ComicPanel/ComicPanel';
import ComicPanelPair from '../ComicPanelPair/ComicPanelPair';
import ComicVote from '../ComicVote/ComicVote';
import CommentThread from '../CommentThread/CommentThread';

//this.props.comic
class Comic extends Component {
	constructor(props){
		super(props);

		this.initialComic = this.props.comic;
		this.template = Util.referenceData.getTemplateById(this.props.comic.templateId);

		this.state = {
			isLoading: false,
			isCommentsVisible: this.props.isCommentsVisible,

			//In state so we can slip comments in/out
			comic: this.props.comic
		}

		this.comicContentRef = React.createRef();

		this.toggleIsCommentsVisible = this.toggleIsCommentsVisible.bind(this);
		this.openShareComicModal = this.openShareComicModal.bind(this);
		this.openReportComicPanelModal = this.openReportComicPanelModal.bind(this);
		this.postComicComment = this.postComicComment.bind(this);
		this.updateComicComment = this.updateComicComment.bind(this);
		this.deleteComicComment = this.deleteComicComment.bind(this);
	}
	toggleIsCommentsVisible() {
		this.setState({
			isCommentsVisible: !this.state.isCommentsVisible
		});
	}
	openShareComicModal(){
		this.props.openModal({
			type: Util.enums.ModalType.ShareComicModal,
			comic: this.props.comic
		});
	}
	openReportComicPanelModal() {
		this.props.openModal({
			type: Util.enums.ModalType.ReportComicPanelModal,
			comic: this.props.comic
		});
	}
	postComicComment(value, callback) {
		Util.api.post('/api/postComicComment', {
			comicId: this.state.comic.comicId,
			value
		})
		.then(result => {
			if(!result.error) {
				//Slap on this user's details
				result.user = {
					userId: Util.context.getUserId(),
					username: Util.context.getUsername(),
					avatar: Util.context.getUserAvatar()
				};

				this.setState({
					comic: {
						...this.state.comic,
						comicComments: [...this.state.comic.comicComments, result]
					}
				});

				if(callback) callback();
			}
		});
	}
	updateComicComment(comicComment, value) {
		//Server
		Util.api.post('/api/updateComicComment', {
			comicCommentId: comicComment.comicCommentId,
			value: value
		});

		//Client
		this.setState({
			comic: {
				...this.state.comic,
				comicComments: this.state.comic.comicComments.map(c => {
					return c.comicCommentId !== comicComment.comicCommentId
						? c
						: {
							...c,
							value: value
						}
				})
			}
		});
	}
	deleteComicComment(comicComment) {
		//Server
		Util.api.post('/api/deleteComicComment', {
			comicCommentId: comicComment.comicCommentId
		});

		//Client
		this.setState({
			comic: {
				...this.state.comic,
				comicComments: this.state.comic.comicComments.filter(c => c.comicCommentId !== comicComment.comicCommentId)
			}
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
				onClick={() => this.openShareComicModal()}
			>
				{comicPanelsPairs.map(comicPanelPair => comicPanelPair)}
				{this.state.isLoading ? <div className="loader masked"></div> : null}
			</div>
			<div className="comic-lower">
				<div className="comic-lower-inner">
					<div className="comic-lower-details">
						<p className="sm"><b>Comic #{this.state.comic.comicId}</b></p>
						<p className="sm">{moment(this.state.comic.completedAt).fromNow()}</p>
					</div>
					<div className="flex-spacer"></div>
					<Button isHollow={!this.state.isCommentsVisible} size="sm" leftIcon={Util.icon.comment} onClick={this.toggleIsCommentsVisible} label={Util.array.any(this.state.comic.comicComments) ? this.state.comic.comicComments.length : null} colour="grey" />
					<ComicVote comicId={this.state.comic.comicId} defaultRating={this.state.comic.rating} defaultValue={this.state.comic.voteValue} />
				</div>
				{this.state.isCommentsVisible
					? <CommentThread comments={this.state.comic.comicComments} 
						onPostComment={this.postComicComment}
						onUpdateComment={this.updateComicComment}
						onDeleteComment={this.deleteComicComment}
					/>
					: null
				}
			</div>
		</div>
	}
}

export default connect(null, { openModal })(Comic);