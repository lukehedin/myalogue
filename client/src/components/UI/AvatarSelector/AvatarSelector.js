import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import ReactSVG from 'react-svg'
import Util from '../../../Util';
import Avatar from '../Avatar/Avatar';
import Button from '../Button/Button';

export default class AvatarSelector extends Component {
	constructor(props){
		super(props);

		//User is only able to use this component with themself
		let avatar = Util.context.getUserAvatar();
		this.state = {
			isLoading: false,

			character: avatar.character,
			expression: avatar.expression,
			colour: avatar.colour
		};

		this.setCharacter = this.setCharacter.bind(this);
		this.setColour = this.setColour.bind(this);
		this.setExpression = this.setExpression.bind(this);
		this.randomize = this.randomize.bind(this);
		this.save = this.save.bind(this);
	}
	setExpression(expression) {
		this.setState({
			expression: expression
		});
	}
	setCharacter(character) {
		this.setState({
			character: character
		});
	}
	setColour(colour) {
		this.setState({
			colour: colour
		});
	}
	randomize() {
		this.setState({
			colour: Util.random.getRandomInt(1, Util.avatar.getColourCount()),
			expression: Util.random.getRandomInt(1, Util.avatar.getExpressionCount()),
			character: Util.random.getRandomInt(1, Util.avatar.getCharacterCount())
		});
	}
	save() {
		this.setState({
			isLoading: true
		});

		Util.api.post('/api/saveAvatar', {
			avatar: {
				character: this.state.character,
				expression: this.state.expression,
				colour: this.state.colour
			}
		})
		.then(result => {
			if(!result.error) {
				window.location.reload();
			} else {
				this.setState({
					isLoading: false
				});
			}
		});
	}
	render() {
		if(this.state.isLoading) return <div className="loader"></div>;
		
		let expressionMax = Util.avatar.getExpressionCount();
		let characterMax = Util.avatar.getCharacterCount();
		let colourMax = Util.avatar.getColourCount();

		let loopValIfNeeded = (val, max, callback) => {
			if(val < 1) val = max;
			if(val > max) val = 1;
			callback(val);
		};

		return <div className="avatar-selector">
			<Avatar user={{ 
				avatar: {
					character: this.state.character,
					expression: this.state.expression,
					colour: this.state.colour
				}
			}} />
			<div className="button-container justify-center">
				<Button size="md" colour="black" isHollow={true} label="Randomize" onClick={this.randomize} />
			</div>
			<div className="avatar-settings">
				<div className="avatar-setting">
					<Button isHollow={true} leftIcon={Util.icon.back} onClick={() => loopValIfNeeded(this.state.character - 1, characterMax, this.setCharacter)} />
					<p className="setting-label">Character</p>
					<Button isHollow={true} leftIcon={Util.icon.next} onClick={() => loopValIfNeeded(this.state.character + 1, characterMax, this.setCharacter)}/>
				</div>
				<div className="avatar-setting">
					<Button isHollow={true} leftIcon={Util.icon.back} onClick={() => loopValIfNeeded(this.state.expression - 1, expressionMax, this.setExpression)} />
					<p className="setting-label">Expression</p>
					<Button isHollow={true} leftIcon={Util.icon.next} onClick={() => loopValIfNeeded(this.state.expression + 1, expressionMax, this.setExpression)} />
				</div>
				<div className="avatar-setting">
					<Button isHollow={true} leftIcon={Util.icon.back} onClick={() => loopValIfNeeded(this.state.colour - 1, colourMax, this.setColour)} />
					<p className="setting-label">Background</p>
					<Button isHollow={true} leftIcon={Util.icon.next} onClick={() => loopValIfNeeded(this.state.colour + 1, colourMax, this.setColour)}/>
				</div>
			</div>
			<div className="button-container justify-center">
				<Button size="lg" colour="pink" label="Save avatar" onClick={this.save} />
			</div>
		</div>
	}
}