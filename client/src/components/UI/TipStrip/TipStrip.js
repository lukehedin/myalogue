import React, { Component } from 'react';
import Util from '../../../Util';

import Button from '../Button/Button';

import derail from './derail.png';
import guessing from './guessing.png';
import lazy from './lazy.png';
import names from './names.png';
import skip from './skip.png';

export default class TipStrip extends Component {
	constructor(props) {
		super(props);
		
		const tips = [{
			tip: `Don't be lazy`,
			image: lazy,
			details: `There should be enough dialogue for the next player to carry on the story. Before submitting, ask yourself if you could write the next panel if all you could see was your dialogue.`,
			alternatives: [
				`Ok, what flavour of gum do you want?`,
				`How much will you pay me for it?`,
				`Well you should go buy yourself some gum, then.`
			]
		}, {
			tip: `Avoid names after the second panel`,
			image: names,
			details: `If you give a character a name after the second panel, you're assuming that they haven't been named already! Even assuming pronouns or relationships can be risky here, so tread carefully.`,
			alternatives: [
				`I'm good. What's up?`,
				`I'm alright, have you seen the news?`,
				`Don't pretend you care about me.`
			]
		}, {
			tip: `Avoid guessing information`,
			image: guessing,
			details: `Most comics can be continued without needing to guess prior information. The more specific your guess is, the more likely it will conflict with information established earlier in the comic. Try to keep it ambiguous.`,
			alternatives: [
				`Seven seems like a lot!`,
				`I have three in my car already.`,
				`Can I just have half of one?`
			]
		}, {
			tip: `Stay on topic, don't derail`,
			image: derail,
			details: `Derailing is when your dialogue is completely irrelevant to the plot in the previous panel. It's okay to change the topic of conversation, but you should try to do it in a realistic way.`,
			alternatives: [
				`What? But we already ate...`,
				`I can't eat now, I'm heading to the flat earth convention!`,
				`Let's get tacos with Dave!`
			]
		}, {
			tip: `Out of ideas? Skip!`,
			image: skip,
			details: `If you don't know what to write for the next panel, skip it! Other players may understand a reference you don't. If a panel is skipped by lots of players, it is removed from the comic.`,
			alternatives: [
				`Click the skip button.`,
				`Seriously, just click the skip button.`,
				`Skip as much as you want.`
			]
		}];
		
		this.state = {
			tip: Util.array.random(tips)
		};
	}
	render() {
		return <div className="tip-strip">
			<div className="tip-strip-inner">
				<img className="tip-image horizontal" src={this.state.tip.image} />
				<div className="tip-detail">
					<img className="tip-image vertical" src={this.state.tip.image} />
					<h4>Tip: {this.state.tip.tip}</h4>
					<p className="sm">{this.state.tip.details}</p>
				</div>
			</div>
		</div>
	}
}