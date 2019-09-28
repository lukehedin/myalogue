import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

export default class ComicPanelAuthorList extends Component {
	render() {
		let authors = [];
		this.props.comic.comicPanels.forEach(comicPanel => {
			if(!authors.find(author => author.userId === comicPanel.userId)) {
				authors.push({
					userId: comicPanel.userId,
					username: comicPanel.username
				});
			}
		});

		return <span>{authors.map((author, idx) => {
			return <span key={idx}><Link to={Util.route.profile(author.userId)}>{author.username}</Link>{(idx === authors.length - 2 ? ' and ' : idx === authors.length - 1 ? '' : ', ')}</span>
		})}</span>
	}
}