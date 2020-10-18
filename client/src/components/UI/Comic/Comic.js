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
import ContextMenu from '../ContextMenu/ContextMenu';

//this.props.comic
class Comic extends Component {
	constructor(props){
		super(props);

		this.initialComic = this.props.comic;
		this.template = Util.context.getTemplateById(this.props.comic.templateId);

		this.state = {
			isLoading: false,
			isCommentsVisible: this.props.isCommentsVisible || Util.array.any(this.props.comic.comicComments) || Util.array.any(this.props.comic.userAchievements),

			//In state so we can slip comments in/out
			comic: this.props.comic
		}

		this.toggleIsCommentsVisible = this.toggleIsCommentsVisible.bind(this);
		this.postComicComment = this.postComicComment.bind(this);
		this.updateComicComment = this.updateComicComment.bind(this);
		this.deleteComicComment = this.deleteComicComment.bind(this);

		this.shareComic = this.shareComic.bind(this);
		this.openComicDetailsModal = this.openComicDetailsModal.bind(this);
		this.openReportComicPanelModal = this.openReportComicPanelModal.bind(this);
	}
	toggleIsCommentsVisible() {
		this.setState({
			isCommentsVisible: !this.state.isCommentsVisible
		});
	}
	openComicDetailsModal(){
		const { comic } = this.state;

		this.props.openModal({
			type: Util.enums.ModalType.ComicDetailsModal,
			comic: comic
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
				result.user = Util.context.getUser(); //Slap on this user's deets

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
				comicComments: this.state.comic.comicComments.map(cc => {
					return cc.comicCommentId !== comicComment.comicCommentId
						? cc
						: {
							...cc,
							value: value,
							updatedAt: new Date()
						}
				})
			}
		});
	}
	deleteComicComment(comicComment) {
		//confirm code is on the comment component
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
	shareComic() {
		const { comic } = this.state;

		if(navigator.share) {
			navigator.share({
				title: `Comic #${comic.comicId}`,
				text: Util.context.getTemplateById(comic.templateId).name,
				url: window.location.origin + Util.route.comic(comic.comicId)
			});
		}
	}
	render() {
		const { comic, isCommentsVisible, isLoading} = this.state;
		const comicTitle = `Comic #${comic.comicId}`;
		const comicTitleShare = `Comic%20%23${comic.comicId}`;
		const comicLink = window.location.origin + Util.route.comic(comic.comicId);

		//Put comic panels into pairs
		let comicPanelsPairs = [];
		let heldPanel = null;
		comic.comicPanels.forEach((comicPanel, idx) => {
			let leftLabel = null;
			if(idx === 0 && comicPanel.comicId) leftLabel = `${comicTitle} ${Util.route.getHost()}`;

			let panel = <ComicPanel isColour={true} comicPanel={comicPanel} leftLabel={leftLabel} />

			if(idx % 2 === 0) {
				heldPanel = panel;
			} else {
				comicPanelsPairs.push(<ComicPanelPair key={idx}>
					{heldPanel}
					{panel}
				</ComicPanelPair>);
				heldPanel = null;
			}
		});

		let comments = comic.comicComments;
		//Add in user achievements comment if applicable
		if(Util.array.any(comic.userAchievements)) {
			let userAchievementLookup = {};
			comic.userAchievements.forEach(userAchievement => {
				let panelByUser = comic.comicPanels.find(comicPanel => comicPanel.user && comicPanel.user.userId === userAchievement.userId);
				let user = panelByUser ? panelByUser.user : null;
				let achievement = Util.context.getAchievementByType(userAchievement.type);
				
				if(user && achievement) {
					let existingUsernames = userAchievementLookup[achievement.name];

					if(existingUsernames && !existingUsernames.includes(user.username)) {
						userAchievementLookup[achievement.name].push(user.username)
					} else if(!existingUsernames) {
						userAchievementLookup[achievement.name] = [user.username];
					}
				}
			});

			comments = [...Object.keys(userAchievementLookup).map(userAchievementName => {
				let usernames = userAchievementLookup[userAchievementName];
				let usernameString = "";

				usernames.forEach((username, idx) => {
					if(idx !== 0) usernameString += idx === usernames.length - 1 ? " and " : ", ";
					usernameString += `@${username}`;
				});
				return {
					value: `The achievement **${userAchievementName}** was unlocked by ${usernameString}!`
				}
			}), ...comments]
		}

		let createdByInfo = 'Anonymous users';
		if(comic.group) {
			createdByInfo = comic.group.name;
		} else if(!comic.isAnonymous) {
			let userCount = [...new Set(comic.comicPanels.filter(cp => cp.user).map(cp => cp.user.userId))].length;
			createdByInfo = `${userCount} ${Util.format.pluralise(userCount, 'user')}`;
		}

		return <div className={`comic comic-${comic.comicId}`}>
			{this.props.isUpperInfoHidden
				? null
				: <div className="comic-upper comic-width">
					<p>{comicTitle} - Completed {moment(comic.completedAt).fromNow()}</p>
					<p>{createdByInfo}{comic.challenge
						? <span> - <b>{comic.challenge}</b></span>
						: null
					}</p>
					
				</div>
			}
			<div className="comic-content no-select" onClick={() => this.openComicDetailsModal()}>
				{comicPanelsPairs.map(comicPanelPair => comicPanelPair)}
				{isLoading ? <div className="loader masked"></div> : null}
			</div>
			{comic.comicId
				? <div className="comic-lower comic-width">
					<div className="comic-lower-inner">
						{navigator.share
							? <Button label="Share" isHollow={true} size="sm" leftIcon={Util.icon.share} onClick={this.shareComic} colour="pink" />
							: <ContextMenu alignHorizontal="left" alignVertical="top" menuItems={[{
								label: 'Copy URL',
								icon: Util.icon.copy,
								onClick: () => Util.fn.copyToClipboard(comicLink)
							}, {
								label: 'Reddit',
								icon: Util.icon.reddit,
								link: `https://www.reddit.com/submit?url=${comicLink}&title=${comicTitleShare}`,
							}, {
								label: 'Twitter',
								icon: Util.icon.twitter,
								link: `https://twitter.com/intent/tweet?text=${comicLink}%20${comicTitleShare}`
							}, { 
								label: 'Facebook',
								icon: Util.icon.facebook,
								link: `http://www.facebook.com/share.php?u=${window.location.origin + Util.route.comic(comic.comicId)}`
							}]}>
								<Button label="Share" isHollow={true} size="sm" leftIcon={Util.icon.share} colour="pink" />
							</ContextMenu>
						}
						<div className="flex-spacer"></div>
						<Button isHollow={!isCommentsVisible} size="sm" leftIcon={Util.icon.comment} onClick={this.toggleIsCommentsVisible} label={Util.array.any(comic.comicComments) ? comic.comicComments.length : null} colour="grey" />
						<ComicVote comicId={comic.comicId} defaultRating={comic.rating} defaultValue={comic.voteValue} />
					</div>
					{isCommentsVisible
						? <CommentThread comments={comments} 
								onPostComment={this.postComicComment}
								onUpdateComment={this.updateComicComment}
								onDeleteComment={this.deleteComicComment}
							/>
						: null
					}
				</div>
				: null
			}
		</div>
	}
}

export default connect(null, { openModal })(Comic);