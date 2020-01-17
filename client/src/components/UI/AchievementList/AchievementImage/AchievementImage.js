import React, { Component } from 'react';
import Util from '../../../../Util';

import achievementsImage from './achievements.png';

//this.props.achievementType
export default class Avatar extends Component {
	render() {
		let achievementsCount = Util.context.getAchievements().length;
		const achievementImageSize = 96;
		let imageWidth = achievementImageSize * achievementsCount;
		
		let size = this.props.size || 48;
		let backgroundX = -((this.props.achievementType - 1) % achievementsCount) * size;

		let style={ 
			width: size,
			height: size,
			minWidth: size,
			minHeight: size,
			backgroundSize: `${(size / achievementImageSize) * imageWidth}px ${(size / achievementImageSize) * achievementImageSize}px`,
			backgroundImage: `url('${achievementsImage}')`, 
			backgroundPositionX: backgroundX, 
			backgroundPositionY: 0
		};

		return <div className="achievement-image" style={style}></div>;
	}
}