import React, { Component } from 'react';
import Util from '../../../Util';

import CopyButton from '../CopyButton/CopyButton';
import ComicPanelAuthorList from '../ComicPanelAuthorList/ComicPanelAuthorList';

export default class ShareComicPanel extends Component {
	constructor(props){
		super(props);

		this.onInputClick = this.onInputClick.bind(this);
	}
	onInputClick(e) {
		e.target.select();
	}
	render() {
		let comicLink = Util.route.getHost() + Util.route.comic(this.props.comic.comicId);

		return <div className="share-comic-container">
			<p className="center sm">Comic #{this.props.comic.comicId} by <ComicPanelAuthorList comic={this.props.comic} />.</p>
			<input className="input-link" onClick={this.onInputClick} readOnly={true} defaultValue={comicLink}></input>
			<CopyButton toCopy={comicLink} />
		</div>;
	}
}