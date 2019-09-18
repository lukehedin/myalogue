import React, { Component } from 'react';
import Util from '../../../Util';

import Button from '../Button/Button';

export default class GameNavigation extends Component {
	render() {
		let latestGameId = Util.context.getLatestGameId();
		
		return <div className={`game-navigation ${this.props.className || ''}`}>
			<div className="button-container">
				<Button 
					to={this.props.toFn(1)} 
					className={this.props.gameId > 1 ? '' : 'disabled invisible'} 
					label="First"
					leftIcon={Util.icon.first}
				/>
				<Button 
					to={this.props.toFn(this.props.gameId - 1)} 
					className={this.props.gameId > 1 ? '' : 'disabled invisible'} 
					label="Previous" 
					leftIcon={Util.icon.back}
				/>
			</div>
			<div className="flex-spacer"></div>
			<div className="game-info">
				<h5>Game</h5>
				<h3>{this.props.gameId}</h3>
			</div>
			<div className="flex-spacer"></div>
			<div className="button-container">
				<Button 
					to={this.props.toFn(this.props.gameId + 1)} 
					className={this.props.gameId !== latestGameId ? '' : 'disabled invisible'}
					label="Next"
					rightIcon={Util.icon.next}
				/>
				<Button 
					to={this.props.toFn(latestGameId)} 
					className={this.props.gameId !== latestGameId ? '' : 'disabled invisible'}
					label="Latest" 
					rightIcon={Util.icon.last}
				/>
			</div>
		</div>;
	}
}