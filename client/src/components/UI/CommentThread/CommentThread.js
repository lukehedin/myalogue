import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import CommentInput from '../CommentInput/CommentInput';
import Comment from '../Comment/Comment';
import UserAvatar from '../UserAvatar/UserAvatar';

export default class CommentThread extends Component {
	constructor(props){
		super(props);

		this.state = {
			comments: (this.props.comments || []),

			newCommentValue: ''
		};

		this.commentsContainerRef = React.createRef();
		this.commentInputRef = React.createRef();
		
		this.scrollToBottom = this.scrollToBottom.bind(this);
		this.postComment = this.postComment.bind(this);
		this.replyToComment = this.replyToComment.bind(this);
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
				comments: this.props.comments
			}, this.scrollToBottom);
		}
	}
	scrollToBottom() {
		let commentsContainer = this.commentsContainerRef.current;
		if(commentsContainer) commentsContainer.scrollTo(0, commentsContainer.scrollHeight);
	}
	postComment(value, callback) {
		if(this.props.onPostComment) {
			this.props.onPostComment(value, () => {
				this.scrollToBottom(); //Slip the scroll fn into the callback
				if(callback) callback();
			});
		}
	}
	replyToComment(username) {
		let commentInput = this.commentInputRef.current;
		if(commentInput) commentInput.focus(`@${username} `);
	}
	render() {
		return <div className="comment-thread">
			{Util.array.any(this.state.comments)
				? <div className="comments" ref={this.commentsContainerRef}>
					{this.state.comments.map((comment, idx) => <Comment key={idx} 
						comment={comment} 
						onReply={this.props.hideCommentInput ? null : this.replyToComment}
						onDelete={this.props.onDeleteComment} //Users can always delete their comments, regardless of permissions
						onUpdate={this.props.hideCommentInput ? null : this.props.onUpdateComment}
					/>)}
					{this.state.isLoadingNewComment 
						? <p className="posting-message empty-text center sm">Posting...</p>
						: null
					}
				</div>
				: null
			}
			{Util.context.isAuthenticated()
				? this.props.hideCommentInput
					? null
					: <div className="comment-input-container">
						<UserAvatar size={32} />
						<CommentInput ref={this.commentInputRef} isDisabled={this.state.isLoadingNewComment} onSubmit={this.postComment} buttonLabel='Post' placeholder='Add a comment' />
					</div>
				: <p className="empty-text"><Link to={Util.route.register()}>Create an account</Link> to make comments, rate comics and more.</p>
			}
		</div>
	}
}