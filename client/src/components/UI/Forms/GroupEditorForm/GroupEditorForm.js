import React, { Component } from 'react';
import validator from 'validator';
import Util from '../../../../Util';

import asForm from '../asForm';

import Button from '../../Button/Button';

class GroupEditorForm extends Component {
	render() {
		return <form className="flat-form" onSubmit={this.props.submitForm}>
			{this.props.getField('name')}
			{this.props.getField('isPublic')}
			{this.props.getField('description')}
			{this.props.getField('instruction')}
			{this.props.getField('avatar')}
			<p className="form-message">A group instruction is displayed during play when making comics with the group. It is completely optional, must be 64 characters or less and can be changed later.</p>
			<p className="form-message">eg. "only speak in rhyme", "make frequent puns about sea creatures" or "the author of the final panel must speak like Yoda".</p>
			<div className="button-container">
				<Button size="lg" colour="pink" label={this.props.formData.groupId ? 'Save group' : 'Create group'} type="submit" />
			</div>
		</form>
	}
}

export default asForm(GroupEditorForm, {
	fields: {
		name: {
			label: 'Name',
			placeholder: 'Enter a group name',
			getError: (val) => {
				if(!validator.isLength(val, { min: 3 })) return 'Name too short (minimum 3 characters)';
				if(!validator.isLength(val, { max: 20 })) return 'Name too long (maximum 20 characters)';
			}
		},
		description: {
			label: 'Description',
			placeholder: 'Describe the purpose of the group',
			type: Util.enums.FieldType.Textarea,
			isOptional: true,
			getError: (val, formData) => {
				if(!validator.isLength(val, { max: 8000 })) return 'Description too long (maximum 8000 characters)';
			}
		},
		instruction: {
			label: 'Instruction',
			placeholder: 'Enter a group instruction',
			isOptional: true,
			getError: (val) => {
				if(!validator.isLength(val, { max: 64})) return 'Instruction must be 64 characters or less.'
			}
		},
		isPublic: {
			label: 'Allow users to join without approval (public group)',
			type: Util.enums.FieldType.Checkbox
		},
		avatar: {
			label: 'Group avatar',
			type: Util.enums.FieldType.ImageUpload
		}
	}
})