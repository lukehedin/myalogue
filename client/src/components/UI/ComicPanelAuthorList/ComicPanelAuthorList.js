import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

export default class ComicPanelAuthorList extends Component {
	render() {
		let comicPanels = this.props.comic.comicPanels;

		return <span>{comicPanels.map((comicPanel, idx) => {
			return <span key={idx}><Link to={Util.route.profile(comicPanel.userId)}>{comicPanel.username}</Link>{(idx === comicPanels.length - 2 ? ' and ' : idx === comicPanels.length - 1 ? '' : ', ')}</span>
		})}</span>
	}
}