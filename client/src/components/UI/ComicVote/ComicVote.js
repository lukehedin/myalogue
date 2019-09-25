import React, { Component } from 'react';
import Util from '../../../Util';

import Button from '../Button/Button';

export default class ComicVote extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLocked: false,

			value: this.props.defaultValue || 0,
			rating: this.props.defaultRating || 0
		};

		this.setValue = this.setValue.bind(this);
	}
	setValue(value) {
		if(this.state.isLocked) return;
		
		this.setState({
			isLocked: true,
			value: value,
			rating: this.state.rating + (value - this.state.value)
		});

		Util.analytics.event(`Comic`, `Comic rated`);
		Util.api.post('/api/voteComic', {
			comicId: this.props.comicId,
			value: value
		})
		.then(() => {
			this.setState({
				isLocked: false
			});
		});
	}
	render() {
		let isLoggedIn = !!Util.context.getUserId();

		let getVoteButton = (value) => {
			return <Button 
				label={value > 0 ? '😂' : '😒'} 
				isHollow={value !== this.state.value} 
				size="sm"
				colour={value !== this.state.value ? 'grey' : 'grey'}
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
			<h4 className={`rating ${this.state.value !== 0 ? 'rated' : ''}`}>{this.state.rating}</h4>
			{getVoteButton(1)}
		</div>
	}
}