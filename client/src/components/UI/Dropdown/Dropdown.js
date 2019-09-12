import React, { Component } from 'react';

export default class Dropdown extends Component {
	render() {
		let options = this.props.options || this.props.getOptions();

		return <select>
			{options.map((option, idx) => <option key={idx}>{option[this.props.displayProp]}</option>)}
		</select>
	}
}