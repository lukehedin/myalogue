import React, { Component } from 'react';
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
	render() {
		if(!this.props.comment.user) return null;
		
		let user = this.props.comment.user;

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
							placeholder="Edit the comment" 
							value={this.props.comment.value} 
							onCancel={() => this.setIsEditing(false)} 
							onSubmit={(value) => {
								this.props.onUpdate(this.props.comment, value);
								this.setIsEditing(false);
							}}
						/>
						: <div className="comment-value" dangerouslySetInnerHTML={{ __html: Util.format.userTextToSafeHtml(this.props.comment.value)}}></div>
					}
					{user.userId === Util.context.getUserId() && !this.state.isEditing
						? <div className="comment-actions">
							<a onClick={() => this.setIsEditing(true)}>Edit</a>
							<a onClick={this.deleteComment}>Delete</a>
						</div>
						: null
					}
				</div>
			</div>
		</div>
	}
}

export default connect(null, { openModal })(Comment);