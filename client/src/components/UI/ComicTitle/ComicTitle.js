import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

export default class ComicTitle extends Component {
	render() {
		let comic = this.props.comic;
		
		let getComicAuthorLabel = () => {
			if(!comic.userId) return <span>{comic.username || 'TODO'}</span>;
			return this.props.isFakeLink
				? <span className="faux-link">{comic.username}</span>
				: <Link to={Util.route.profile(comic.userId)}>{comic.username}</Link>;
		}
		
		return <span className="comic-title">#{comic.comicId}</span>;
	}
}