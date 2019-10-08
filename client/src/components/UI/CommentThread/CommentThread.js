import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Textarea from 'react-textarea-autosize';

import Button from '../Button/Button';
import Comment from '../Comment/Comment';
import Util from '../../../Util';
import Avatar from '../Avatar/Avatar';

export default class CommentThread extends Component {
	constructor(props){
		super(props);

		this.state = {
			comments: (this.props.comments || []),
			newCommentValue: ''
		};

		this.commentsContainerRef = React.createRef();

		this.onNewCommentChange = this.onNewCommentChange.bind(this);
		this.postComment = this.postComment.bind(this);
	}
	componentDidMount() {
		let commentsContainer = this.commentsContainerRef.current;

		if(commentsContainer) {
			commentsContainer.scrollTo(0, commentsContainer.scrollHeight);
		}
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.comments !== prevProps.comments;
	}
	componentDidUpdate(prevProps, prevState, isNewProps) {
		if(isNewProps) {
			this.setState({
				comments: this.props.comments
			});
		}
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
			newCommentValue: ''
		});
	}
	render() {
		return <div className="comment-thread">
			{Util.array.any(this.state.comments)
				? <div className="comments" ref={this.commentsContainerRef}>
					{this.state.comments.map(comment => <Comment key={comment.comicCommentId} comment={comment} onDelete={this.props.onDeleteComment} />)}
				</div>
				: null
			}
			{Util.context.isAuthenticated()
				? <div className="new-comment">
					<Avatar size={32} />
					<div className="new-comment-inner">
						<Textarea placeholder="Add a comment" className="new-comment-field" onChange={this.onNewCommentChange} value={this.state.newCommentValue}  />
						<Button onClick={this.postComment} colour="pink" size="sm" label="Post" isDisabled={!this.state.newCommentValue} />
					</div>
				</div>
				: <p className="empty-text">You need to <Link to={Util.route.register()}>create an account</Link> to make comments.</p>
			}
		</div>
	}
}