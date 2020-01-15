import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import ReactSVG from 'react-svg'
import Util from '../../../Util';
import UserAvatar from '../UserAvatar/UserAvatar';
import Button from '../Button/Button';
import ImageUpload from '../ImageUpload/ImageUpload';

export default class AvatarSelector extends Component {
	constructor(props){
		super(props);

		//User is only able to use this component with themself
		let avatar = Util.context.getUserAvatar();
		this.state = {
			isLoading: false,

			url: avatar.url,

			character: avatar.character,
			expression: avatar.expression,
			colour: avatar.colour
		};

		this.setLoading = this.setLoading.bind(this);
		this.removeAvatar = this.removeAvatar.bind(this);
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
			colour: Util.random.getRandomInt(1, Util.userAvatar.getColourCount()),
			expression: Util.random.getRandomInt(1, Util.userAvatar.getExpressionCount()),
			character: Util.random.getRandomInt(1, Util.userAvatar.getCharacterCount())
		});
	}
	save() {
		this.setState({
			isLoading: true
		});

		Util.api.post('/api/saveUserAvatar', {
			avatar: {
				character: this.state.character,
				expression: this.state.expression,
				colour: this.state.colour
			}
		})
		.then(() => window.location.reload());
	}
	setLoading(isLoading) {
		this.setState({
			isLoading: isLoading
		});
	}
	removeAvatar() {
		this.setState({
			isLoading: true
		});

		Util.api.post('/api/removeUserAvatar')
			.then(() => window.location.reload())
	}
	render() {
		let expressionMax = Util.userAvatar.getExpressionCount();
		let characterMax = Util.userAvatar.getCharacterCount();
		let colourMax = Util.userAvatar.getColourCount();

		let loopValIfNeeded = (val, max, callback) => {
			if(val < 1) val = max;
			if(val > max) val = 1;
			callback(val);
		};

		return <div className="avatar-selector">
			{this.state.isLoading ? <div className="loader masked"></div> : null}
			<h2>Change avatar</h2>
			<UserAvatar 
				size={96}
				user={{ 
					avatar: {
						url: this.state.url,
						character: this.state.character,
						expression: this.state.expression,
						colour: this.state.colour
					}
			}} />
			{this.state.url
				? null
				: <div>
					<div className="button-container">
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
					<div className="button-container">
						<Button size="md" colour="pink" label="Save avatar" onClick={this.save} />
					</div>
					<h5 className="or">or</h5>
				</div>
			}
			<div className="button-container">
				<ImageUpload endpoint='/api/uploadUserAvatar' 
					label={this.state.url ? 'Upload new image' : 'Upload image'} 
					onUploaded={() => window.location.reload()} 
					onUploadingStart={() => this.setLoading(true)} 
					onUploadingEnd={() => this.setLoading(false)} 
				/>
			</div>
			{this.state.url
				? <div className="button-container">
					<Button label="Remove image" onClick={this.removeAvatar} />
				</div>
				: null
			}
		</div>
	}
}