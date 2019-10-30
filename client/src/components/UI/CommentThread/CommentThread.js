import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import CommentInput from '../CommentInput/CommentInput';
import Comment from '../Comment/Comment';
import Avatar from '../Avatar/Avatar';

export default class CommentThread extends Component {
	constructor(props){
		super(props);

		this.state = {
			comments: (this.props.comments || []),

			newCommentValue: ''
		};

		this.commentsContainerRef = React.createRef();
		
		this.scrollToBottom = this.scrollToBottom.bind(this);
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
	render() {
		return <div className="comment-thread">
			{Util.array.any(this.state.comments)
				? <div className="comments" ref={this.commentsContainerRef}>
					{this.state.comments.map(comment => <Comment key={comment.comicCommentId} comment={comment} onDelete={this.props.onDeleteComment} onUpdate={this.props.onUpdateComment} />)}
					{this.state.isLoadingNewComment 
						? <p className="posting-message empty-text center sm">Posting...</p>
						: null
					}
				</div>
				: null
			}
			{Util.context.isAuthenticated()
				? <div className="comment-input-container">
					<Avatar size={32} />
					<CommentInput isDisabled={this.state.isLoadingNewComment} onSubmit={this.postComment} buttonLabel='Post' placeholder='Add a comment' />
				</div>
				: <p className="empty-text">You need to <Link to={Util.route.register()}>create an account</Link> to make comments.</p>
			}
		</div>
	}
}