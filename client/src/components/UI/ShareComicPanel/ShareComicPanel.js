import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import CopyButton from '../CopyButton/CopyButton';
import ComicTitle from '../ComicTitle/ComicTitle';
import Button from '../Button/Button';

export default class ShareComicPanel extends Component {
	constructor(props){
		super(props);

		this.onInputClick = this.onInputClick.bind(this);
	}
	onInputClick(e) {
		e.target.select();
	}
	render() {
		let comicLink = Util.route.getHost() + Util.route.game(this.props.comic.gameId, this.props.comic.comicId);

		return <div className="share-comic-panel">
			<h4><ComicTitle comic={this.props.comic} /></h4>
			<input className="input-link" onClick={this.onInputClick} readOnly={true} defaultValue={comicLink}></input>
			<CopyButton toCopy={comicLink} />
			<div className="comic-image">
				<img className="image-download" src={this.props.comicDataUrl} />
				{this.props.comicDataUrl
					? <img className="image-thumbnail" src={this.props.comicDataUrl} />
					: <p className="empty-text">Could not generate comic image. You can still share the comic using the link above.</p>
				}
			</div>
			{Util.route.isCurrently(Util.route.game(this.props.comic.gameId))
				? null
				: <Button to={Util.route.game(this.props.comic.gameId)} size="sm" colour="black" label="View other comics in game" />
			}
		</div>;
	}
}