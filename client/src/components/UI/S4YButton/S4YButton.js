import React, { Component } from 'react';

import face from '../../../images/face_white.png';

import Button from '../Button/Button';

export default class S4YButton extends Component {
	render() {
		return <Button {...this.props} className="s4y-button" colour="pink" leftIcon={face} isIconNotSvg={true} label="Speak 4 Yourself" />
	}
}