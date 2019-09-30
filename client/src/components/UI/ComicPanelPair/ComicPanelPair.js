import React, { Component } from 'react';

export default class ComicPanelPair extends Component {
	render() {
		return <div className="comic-panel-pair">
			{this.props.children}
		</div>
	}
}