import React, { Component } from 'react';
import validator from 'validator';
import Util from '../../../../Util';

import asForm from '../asForm';

import Button from '../../Button/Button';

class TeamEditorForm extends Component {
	render() {
		return <form onSubmit={this.props.submitForm}>
			{this.props.getField('name')}
			{this.props.getField('description')}
			<div className="button-container justify-center">
				<Button size="lg" colour="pink" label={this.props.formData.teamId ? 'Save team' : 'Create team'} type="submit" />
			</div>
		</form>
	}
}

export default asForm(TeamEditorForm, {
	fields: {
		name: {
			label: 'Team name',
			getError: (val) => {
				if(!validator.isLength(val, { min: 3 })) return 'Team name too short (minimum 3 characters)';
				if(!validator.isLength(val, { max: 20 })) return 'Team name too long (maximum 20 characters)';
			}
		},
		description: {
			label: 'Team description',
			type: Util.enums.FieldType.Textarea,
			isOptional: true,
			getError: (val, formData) => {
				if(!validator.isLength(val, { max: 8000 })) return 'Team description too long (maximum 8000 characters)';
			}
		}
	}
})