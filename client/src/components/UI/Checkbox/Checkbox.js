import React, { Component } from 'react';

export default class Checkbox extends Component {
	constructor(props){
		super(props);
		
		this.state = {
			value: this.props.value
		};

		this.onChange = this.onChange.bind(this);
	}
	onChange() {
		let value = !this.state.value;

		this.setState({
			value
		});

		if(this.props.onChange) this.props.onChange(value);
	}
	render() {
		return <div className={`checkbox ${this.props.isSwitch ? 'switch' : ''} ${this.state.value ? 'checked' : ''}`}>
			<label className="checkbox-inner">
				{this.props.label ? <span className="checkbox-label">{this.props.label}</span> : null}
				<input value={this.state.value} type="checkbox" onChange={this.onChange} />
				<span className="checkmark">
				{this.props.isSwitch 
					? <span className="knob"></span> 
					: this.state.value 
						? '✓' 
						: null
				}
				</span>
			</label>
		</div>
	}
}