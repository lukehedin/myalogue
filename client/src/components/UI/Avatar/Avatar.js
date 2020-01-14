import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import avatarsImage from '../../../images/avatars.png';

//this.props.user
export default class Avatar extends Component {
	render() {
		let className = "avatar";
		let size = this.props.size || 64;
		let style = {
			width: size,
			height: size,
			minWidth: size,
			minHeight: size
		};

		let avatar = this.props.user
				? Util.avatar.getForUser(this.props.user)
				: Util.context.getAvatar(); //Me

		if(avatar.url) {
			style.backgroundImage = `url('${avatar.url}')`;
			style.backgroundSize = 'contain';
		} else {
			const avatarImageSize = 96;

			let imageWidth = avatarImageSize * Util.avatar.getExpressionCount();
			let imageHeight = avatarImageSize * Util.avatar.getCharacterCount();
			
			let backgroundX = -((avatar.expression - 1) % (Util.avatar.getExpressionCount())) * size;
			let backgroundY = -((avatar.character - 1) % (Util.avatar.getCharacterCount())) * size;

			style.backgroundSize = `${(size / avatarImageSize) * imageWidth}px ${(size / avatarImageSize) * imageHeight}px`;
			style.backgroundImage = `url('${avatarsImage}')`;
			style.backgroundPositionX = backgroundX;
			style.backgroundPositionY = backgroundY;
			style.backgroundColor = `#${Util.avatar.colourLookup[avatar.colour] || Util.avatar.colourLookup[1]}`;
		}

		return this.props.to
			? <Link to={this.props.to} className={className} style={style}></Link>
			: <div className={className} style={style}></div>;
	}
}