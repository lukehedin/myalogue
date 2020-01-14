import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import avatarsImage from '../../../images/avatars.png';

//this.props.user
export default class UserAvatar extends Component {
	render() {
		let className = "user-avatar";
		let size = this.props.size || 64;
		let style = {
			width: size,
			height: size,
			minWidth: size,
			minHeight: size
		};

		let avatar = this.props.user
				? Util.userAvatar.getForUser(this.props.user)
				: Util.context.getUserAvatar(); //Me

		if(avatar.url) {
			style.backgroundImage = `url('${avatar.url}')`;
			style.backgroundSize = 'contain';
		} else {
			const avatarImageSize = 96;

			let imageWidth = avatarImageSize * Util.userAvatar.getExpressionCount();
			let imageHeight = avatarImageSize * Util.userAvatar.getCharacterCount();
			
			let backgroundX = -((avatar.expression - 1) % (Util.userAvatar.getExpressionCount())) * size;
			let backgroundY = -((avatar.character - 1) % (Util.userAvatar.getCharacterCount())) * size;

			style.backgroundSize = `${(size / avatarImageSize) * imageWidth}px ${(size / avatarImageSize) * imageHeight}px`;
			style.backgroundImage = `url('${avatarsImage}')`;
			style.backgroundPositionX = backgroundX;
			style.backgroundPositionY = backgroundY;
			style.backgroundColor = `#${Util.userAvatar.colourLookup[avatar.colour] || Util.userAvatar.colourLookup[1]}`;
		}

		return this.props.to
			? <Link className={className} style={style} to={this.props.to}></Link>
			: <div className={className} style={style}></div>;
	}
}