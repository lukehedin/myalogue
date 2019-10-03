import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import CopyButton from '../CopyButton/CopyButton';
import ComicInfoLabel from '../ComicInfoLabel/ComicInfoLabel';
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
		let comicLink = Util.route.getHost() + Util.route.comic(this.props.comic.comicId);
		let template = Util.context.getTemplateById(this.props.comic.templateId);

		return <div className="share-comic-container">
			<input className="input-link" onClick={this.onInputClick} readOnly={true} defaultValue={comicLink}></input>
			<CopyButton toCopy={comicLink} />
			<Button colour="black" label="View comic page" to={Util.route.comic(this.props.comic.comicId)} />
			<p className="center sm"><ComicInfoLabel comic={this.props.comic} /></p>
			<p className="center sm">Template: <Link to={Util.route.template(template.templateId)}>{template.name}</Link></p>
		</div>;
	}
}