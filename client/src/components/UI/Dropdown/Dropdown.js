import React, { Component } from 'react';

export default class Dropdown extends Component {
	constructor(props){
		super(props);

		this.state = {
			value: this.props.value
		};

		this.onChange = this.onChange.bind(this);
	}
	onChange(e) {
		let stringValue = e.target.value;
		let options = this.props.options || this.props.getOptions();
		
		//We stringify to match
		let selectedOption = options.find(option => (option[this.props.valueProp] + "") === stringValue);
		//Then use (possibly non stringified) value from then on
		let value = selectedOption[this.props.valueProp];

		this.setState({
			value
		});

		if(this.props.onChange) this.props.onChange(value, selectedOption);
	}
	render() {
		let options = this.props.options || this.props.getOptions();

		return <select onChange={this.onChange} value={this.state.value}>
			{options.map((option, idx) => <option value={option[this.props.valueProp]} key={idx}>{option[this.props.displayProp]}</option>)}
		</select>
	}
}