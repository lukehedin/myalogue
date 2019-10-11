import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Textarea from 'react-textarea-autosize';
import isTouchDevice from 'is-touch-device';
import Util from '../../../Util';

import Button from '../Button/Button';
import Comment from '../Comment/Comment';
import Avatar from '../Avatar/Avatar';

export default class CommentThread extends Component {
	constructor(props){
		super(props);

		this.state = {
			comments: (this.props.comments || []),

			newCommentValue: '',
			isLoadingNewComment: false
		};

		this.commentsContainerRef = React.createRef();

		this.onNewCommentTouchEnd = this.onNewCommentTouchEnd.bind(this);
		
		this.scrollToBottom = this.scrollToBottom.bind(this);
		this.onNewCommentChange = this.onNewCommentChange.bind(this);
		this.postComment = this.postComment.bind(this);
	}
	componentDidMount() {
		this.scrollToBottom();
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.comments !== prevProps.comments;
	}
	componentDidUpdate(prevProps, prevState, isNewProps) {
		if(isNewProps) {
			this.setState({
				comments: this.props.comments,
				isLoadingNewComment: false
			}, this.scrollToBottom);
		}
	}
	scrollToBottom() {
		let commentsContainer = this.commentsContainerRef.current;
		if(commentsContainer) commentsContainer.scrollTo(0, commentsContainer.scrollHeight);
	}
	onNewCommentChange(e) {
		this.setState({
			newCommentValue: e.target.value
		});
	}
	postComment() {
		if(this.props.onPostComment) this.props.onPostComment(this.state.newCommentValue);
		//Clear comment field
		this.setState({
			isLoadingNewComment: true,
			newCommentValue: ''
		}, this.scrollToBottom);
	}
	onNewCommentTouchEnd(e) {
		//Mobile keyboard bug was bumping this out of view on focus, this tries to correct it
		if(isTouchDevice()) {
			let textarea = e.target;
			
			let scrollEl = Util.selector.getRootScrollElement();
			scrollEl.style.overflowY = 'hidden';

			setTimeout(() => {
				if(textarea && document.activeElement === textarea) {
					scrollEl.style.overflowY = 'auto';
					if(textarea) textarea.scrollIntoViewIfNeeded();
				}
			}, 500); // 500 gives enough time for the keyboard to pop up.
		}
	}
	render() {
		return <div className="comment-thread">
			{Util.array.any(this.state.comments)
				? <div className="comments" ref={this.commentsContainerRef}>
					{this.state.comments.map(comment => <Comment key={comment.comicCommentId} comment={comment} onDelete={this.props.onDeleteComment} />)}
					{this.state.isLoadingNewComment 
						? <p className="posting-message empty-text center sm">Posting...</p>
						: null
					}
				</div>
				: null
			}
			{Util.context.isAuthenticated()
				? <div className="new-comment">
					<Avatar size={32} />
					<div className="new-comment-inner">
						<Textarea placeholder="Add a comment" className="new-comment-field" onChange={this.onNewCommentChange} value={this.state.newCommentValue} onTouchEnd={this.onNewCommentTouchEnd} />
						<Button onClick={this.postComment} colour="pink" size="sm" label="Post" isDisabled={this.state.isLoadingNewComment || !this.state.newCommentValue} />
					</div>
				</div>
				: <p className="empty-text">You need to <Link to={Util.route.register()}>create an account</Link> to make comments.</p>
			}
		</div>
	}
}