import React, { Component } from 'react';
import Util from '../../../Util';

import Button from '../Button/Button';

export default class ComicVote extends Component {
	constructor(props) {
		super(props);

		this.state = {
			value: this.props.defaultValue || 0,
			rating: this.props.defaultRating || 0
		};

		this.setValue = this.setValue.bind(this);
	}
	setValue(value) {
		this.setState({
			value: value,
			rating: this.state.rating + (value - this.state.value)
		});

		Util.analytics.event(`Comic`, `Comic rated`);
		Util.api.post('/api/voteComic', {
			comicId: this.props.comicId,
			value: value
		});
	}
	render() {
		let isLoggedIn = !!Util.context.getUserId();

		let getVoteButton = (value) => {
			return <Button 
				leftIcon={value > 0 ? Util.icon.like : Util.icon.dislike} 
				isHollow={this.state.value !== value} 
				colour={this.state.value !== value ? 'black' : (value > 0 ? 'green' : 'red')} 
				to={isLoggedIn
					? null
					: Util.route.register()
				}
				onClick={isLoggedIn
					? () => this.setValue(this.state.value === value ? 0 : value)
					: null}
			/>
		}
		
		return <div className="comic-vote">
			{getVoteButton(-1)}
			<h4 className={`rating ${this.state.value > 0 ? 'positive' : this.state.value < 0 ? 'negative' : ''}`}>{this.state.rating}</h4>
			{getVoteButton(1)}
		</div>
	}
}