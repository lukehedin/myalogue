import React, { Component } from 'react';
import Util from '../../../Util';

import CopyButton from '../CopyButton/CopyButton';
import ComicTitle from '../ComicTitle/ComicTitle';

export default class ShareComicPanel extends Component {
	render() {
		let comicLink = Util.route.root + Util.route.template(this.props.comic.templateId, this.props.comic.comicId);

		return <div className="share-comic-panel">
			<h4><ComicTitle comic={this.props.comic} /></h4>
			<input readOnly={true} defaultValue={comicLink}></input>
			<CopyButton toCopy={comicLink} />
			<div className="comic-image">
				<img className="image-download" src={this.props.comicDataUrl} />
				{this.props.comicDataUrl
					? <img className="image-thumbnail" src={this.props.comicDataUrl} />
					: <p className="empty-text">Could not generate comic image. You can still share the comic using the link above.</p>
				}
			</div>
		</div>;
	}
}