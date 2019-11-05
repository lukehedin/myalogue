import React, { Component } from 'react';
import ReactHtmlParser from 'react-html-parser';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { openModal } from '../../../redux/actions';
import moment from 'moment';
import Util from '../../../Util';

import Avatar from '../Avatar/Avatar';
import CommentInput from '../CommentInput/CommentInput';

class Comment extends Component {
	constructor(props){
		super(props);

		this.state = {
			isEditing: false
		};

		this.setIsEditing = this.setIsEditing.bind(this);
		this.deleteComment = this.deleteComment.bind(this);
		this.getCommentValueAsComponent = this.getCommentValueAsComponent.bind(this);
	}
	setIsEditing(isEditing) {
		this.setState({
			isEditing: isEditing
		});
	}
	deleteComment() {
		this.props.openModal({
			type: Util.enums.ModalType.Confirm,
			title: 'Delete comment',
			content: <p>Are you sure you want to delete this comment?</p>,
			yesLabel: 'Delete',
			noLabel: 'Cancel',
			yesFn: () => {
				//The whole comment is passed because we dont know which id property it wants
				if(this.props.onDelete) this.props.onDelete(this.props.comment);
			}
		});
	}
	getCommentValueAsComponent() {
		let html = Util.format.userStringToSafeHtml(this.props.comment.value);
		let components = ReactHtmlParser(html);

		for(let i = 0; i < components.length; i++) {
			let component = components[i];

			if(component.type === "a" && Util.route.isLinkInternal(component.props.href)) {
				components[i] = <Link key={i} to={Util.route.toInternalLink(component.props.href)}>{component.props.children}</Link>;
			}
		}

		return <div className="comment-value">
			{components}
		</div>;
	}
	render() {
		if(!this.props.comment.user) return null;
		
		let user = this.props.comment.user;
		let isMe = user.userId === Util.context.getUserId();

		return <div className="comment">
			<Avatar size={32} to={Util.route.profile(user.username)} user={user} />
			<div className="comment-inner">
				<div className="comment-upper">
					<div className="user-date">
						<Link to={Util.route.profile(user.username)}>{user.username}</Link>
						<span> {moment(this.props.comment.createdAt).fromNow()}</span>
						{this.props.comment.createdAt !== this.props.comment.updatedAt
							? <span> (edited)</span>
							: null
						}
					</div>
					<div className="flex-spacer"></div>
				</div>
				<div className="comment-lower">
					{this.state.isEditing
						? <CommentInput 
							buttonLabel="Save" 
							placeholder="Enter new comment" 
							value={this.props.comment.value} 
							onCancel={() => this.setIsEditing(false)} 
							onSubmit={(value) => {
								this.props.onUpdate(this.props.comment, value);
								this.setIsEditing(false);
							}}
						/>
						: this.getCommentValueAsComponent()
					}
					<div className="comment-actions">
						{isMe && !this.state.isEditing
							? <a onClick={() => this.setIsEditing(true)}>Edit</a>
							: null
						}
						{isMe && !this.state.isEditing
							? <a onClick={this.deleteComment}>Delete</a>
							: null
						}
						{!isMe && Util.context.isAuthenticated() && this.props.onReply
							? <a onClick={() => this.props.onReply(user.username)}>Reply</a>
							: null
						}
					</div>
				</div>
			</div>
		</div>
	}
}

export default connect(null, { openModal })(Comment);