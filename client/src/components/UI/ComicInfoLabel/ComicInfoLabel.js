import React, { Component } from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

export default class ComicInfoLabel extends Component {
	render() {
		let authors = [];
		let anonCount = 0;
		this.props.comic.comicPanels.forEach(comicPanel => {
			if(comicPanel.user) {
				if(!authors.find(author => author.userId === comicPanel.user.userId)) {
					authors.push(comicPanel.user);
				}
			} else {
				anonCount++;
			}
		});

		if(anonCount > 0) {
			authors.push({
				anonCount //this isn't displayed but may pluralise
			});
		}

		return <span>Completed {moment(this.props.comic.completedAt).fromNow()} by {authors.map((author, idx) => {
			return author.anonCount
				? <span key={idx}>{Util.format.pluralise(author.anonCount, 'an anonymous user', 'anonymous users')}</span>
				: <span key={idx}><Link to={Util.route.profile(author.username)}>{author.username}</Link>{(idx === authors.length - 2 ? ' and ' : idx === authors.length - 1 ? '' : ', ')}</span>
		})}.</span>
	}
}