import React, { Component } from 'react';
import Util from '../../../Util';

import face_small from '../../../images/face_white_small.png';

import Button from '../Button/Button';
export default class S4YButton extends Component {
	render() {
		return <Button {...this.props} to={this.props.to || Util.route.play()} className="s4y-button" colour="pink" leftIcon={face_small} isIconNotSvg={true} label="Speak 4 Yourself" />
	}
}