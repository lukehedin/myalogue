import React, { Component } from 'react';
import ReactSVG from 'react-svg';
import Util from '../../../Util';

export default class ShareButtons extends Component {
	render() {
		return <div className="share-buttons">
			<a target="_blank" rel="noopener noreferrer" className="share-button" href={`https://www.reddit.com/submit?url=${window.location.href}${this.props.title ? `&title=${this.props.title}` : ``}`}><ReactSVG src={Util.icon.reddit}/></a>
			<a target="_blank" rel="noopener noreferrer" className="share-button" href={`http://www.facebook.com/share.php?u=${window.location.href}`}><ReactSVG src={Util.icon.facebook}/></a>
			<a target="_blank" rel="noopener noreferrer" className="share-button" href={`https://twitter.com/intent/tweet?text=${window.location.href}${this.props.title ? ` ${this.props.title}` : ``}`}><ReactSVG src={Util.icon.twitter}/></a>
		</div>
	}
}