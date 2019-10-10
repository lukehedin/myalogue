import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { openModal } from '../../../redux/actions';
import moment from 'moment';
import Util from '../../../Util';

import Avatar from '../Avatar/Avatar';

class Comment extends Component {
	constructor(props){
		super(props);

		this.deleteComment = this.deleteComment.bind(this);
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
					<div className="user-date"><Link to={Util.route.profile(user.username)}>{user.username}</Link> {moment(this.props.comment.createdAt).fromNow()}</div>
					<div className="flex-spacer"></div>
				</div>
				<div className="comment-lower">
					<div className="comment-value" dangerouslySetInnerHTML={{ __html: Util.format.userTextToSafeHtml(this.props.comment.value)}}></div>
					{user.userId === Util.context.getUserId()
						? <div className="comment-actions">
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