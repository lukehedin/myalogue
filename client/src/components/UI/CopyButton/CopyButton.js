import React, { Component } from 'react';
import Util from '../../../Util';

import Button from '../Button/Button';

export default class S4YButton extends Component {
	constructor(props){
		super(props);

		this.state = {
			isCopied: false
		};
		
		this.copy = this.copy.bind(this);
	}
	copy() {
		Util.fn.copyToClipboard(this.props.toCopy);

		if(!this.isCopied) {
			this.setState({
				isCopied: true
			});
	
			setTimeout(() => {
				this.setState({
					isCopied: false
				});
			}, 2000);
		}
	}
	render() {
		return <Button 
			colour="pink" 
			size="lg" 
			label={this.state.isCopied ? 'Link copied!' : 'Copy link'} 
			leftIcon={Util.icon.copy} 
			onClick={this.copy} />
	}
}