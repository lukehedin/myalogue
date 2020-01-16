import React, { Component } from 'react';

import Button from '../Button/Button';

export default class ButtonInput extends Component {
	constructor(props) {
		super(props);

		this.state = {
			value: ''
		};

		this.onKeyDown = this.onKeyDown.bind(this);
		this.onChange = this.onChange.bind(this);
		this.submit = this.submit.bind(this);
	}
	onKeyDown(e) {
		if(e.keyCode == 13) this.submit();
	}
	onChange(e) {
		let newVal = e.target.value;
		
		this.setState({
			value: newVal
		});

		if(this.props.onChange) this.props.onChange(newVal);
	}
	submit() {
		if(this.props.onSubmit) this.props.onSubmit(this.state.value);

		this.setState({
			value: ''
		});
	}
	render() {
		return <div className="button-input">
			<input value={this.state.value} placeholder={this.props.placeholder || ''} onChange={this.onChange} onKeyDown={this.onKeyDown}></input>
			<Button onClick={this.submit} isDisabled={!this.state.value} label={this.props.buttonLabel || 'Submit'} />
		</div>;
	}
}