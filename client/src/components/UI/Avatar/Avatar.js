import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import ReactSVG from 'react-svg'
import Util from '../../../Util';

import avatars from '../../../images/avatars.png';

//this.props.user
export default class Avatar extends Component {
	render() {

		let avatar = this.props.user
				? this.props.user.avatar.character && this.props.user.avatar.expression && this.props.user.avatar.colour
					? this.props.user.avatar
					: Util.avatar.getPseudoAvatar(this.props.user.userId)
				: Util.context.getUserAvatar(); //Me

		let avatarImageSize = 96;
		let imageWidth = avatarImageSize * Util.avatar.getExpressionCount();
		let imageHeight = avatarImageSize * Util.avatar.getCharacterCount();
		
		let size = this.props.size || avatarImageSize;
		let backgroundX = -((avatar.expression - 1) % (Util.avatar.getExpressionCount())) * size;
		let backgroundY = -((avatar.character - 1) % (Util.avatar.getCharacterCount())) * size;

		return <div className="avatar" style={{ 
				width: size,
				height: size,
				backgroundSize: `${(size / avatarImageSize) * imageWidth}px ${(size / avatarImageSize) * imageHeight}px`,
				backgroundImage: `url('${avatars}')`, 
				backgroundPositionX: backgroundX, 
				backgroundPositionY: backgroundY,
				backgroundColor: `#${Util.avatar.colourLookup[avatar.colour]}`
			}}>
		</div>
	}
}