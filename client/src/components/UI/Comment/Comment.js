import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { openModal } from '../../../redux/actions';
import moment from 'moment';
import Util from '../../../Util';

import UserAvatar from '../UserAvatar/UserAvatar';
import CommentInput from '../CommentInput/CommentInput';

//Note: a comment should be able to get by and render with nothing but a { value: '' }
class Comment extends Component {
	constructor(props){
		super(props);

		this.state = {
			isEditing: false
		};

		this.setIsEditing = this.setIsEditing.bind(this);
		this.deleteComment = this.deleteComment.bind(this);
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
			content: <p className="center">Are you sure you want to delete this comment?</p>,
			yesLabel: 'Delete',
			noLabel: 'Cancel',
			yesFn: () => {
				//The whole comment is passed because we dont know which id property it wants
				if(this.props.onDelete) this.props.onDelete(this.props.comment);
			}
		});
	}
	render() {
		let user = this.props.comment.user;
		let isMe = user && Util.context.isUserId(user.userId);

		return <div className="comment">
			{user 
				? <UserAvatar size={32} to={Util.route.profile(user.username)} user={user} />
				: <div className="empty-avatar"></div>
			}
			<div className="comment-inner">
				{user && this.props.comment.createdAt
					? <div className="comment-upper">
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
					: null
				}
				<div className="comment-lower">
					{this.state.isEditing
						? <CommentInput 
							buttonLabel="Save" 
							placeholder="Enter new comment" 
							value={this.props.comment.value} 
							onCancel={() => this.setIsEditing(false)} 
							onSubmit={(value) => {
								if(this.props.onUpdate) this.props.onUpdate(this.props.comment, value);
								this.setIsEditing(false);
							}}
						/>
						: <div className="comment-value">
							{Util.format.userStringToSafeComponent(this.props.comment.value, true)}
						</div>
					}
					<div className="comment-actions">
						{isMe && this.props.onUpdate && !this.state.isEditing
							? <a onClick={() => this.setIsEditing(true)}>Edit</a>
							: null
						}
						{isMe && this.props.onDelete && !this.state.isEditing
							? <a onClick={this.deleteComment}>Delete</a>
							: null
						}
						{user && this.props.onReply && !isMe && Util.context.isAuthenticated() && this.props.onReply
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