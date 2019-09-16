import React, { Component } from 'react';
import Util from '../../../../Util';
import validator from 'validator';

import withForm from '../withForm';

import Button from '../../Button/Button';

class TitleComicForm extends Component {
	render() {
		return <form onSubmit={this.props.submitForm}>
			{this.props.getField('title')}
			{this.props.getField('isAnonymous')}
		</form>
	}
}

export default withForm(TitleComicForm, {
	fields: {
		title: {
			label: 'Title',
			placeholder: 'Untitled',
			getError: (val) => {
				if(!validator.isLength(val, { max: 30 })) return 'Please enter a shorter title (maximum 30 characters)';
			}
		},
		isAnonymous: {
			label: 'Submit anonymously',
			type: Util.enum.FieldType.Checkbox
		}
	}
})