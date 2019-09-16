import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

export default class ComicTitle extends Component {
	render() {
		let comic = this.props.comic;
		return <span className="comic-title">"{comic.title}" by {comic.userId ? <Link to={Util.route.profile(comic.userId)}>{comic.username}</Link> : comic.username}</span>;
	}
}