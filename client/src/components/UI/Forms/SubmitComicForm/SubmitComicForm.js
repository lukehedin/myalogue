import React, { Component } from 'react';
import Util from '../../../../Util';
import validator from 'validator';
import { Link } from 'react-router-dom';

import withForm from '../withForm';

import Button from '../../Button/Button';

class SubmitComicForm extends Component {
	render() {
		return <form onSubmit={this.props.submitForm}>
			{this.props.getField('title')}
			{Util.context.isAuthenticated() 
				? this.props.getField('isAnonymous') 
				: null
			}
			{!Util.context.isAuthenticated()
				?<div className="form-message">
					<p>You aren't logged in so your comic will be submitted anonymously. You can never claim ownership of it.</p>
					<p>If you <Link to={Util.route.register()}>register</Link>, you can be recorded as the author.</p>
				</div>
				: <div>
					<input type="checkbox" value={false}>Submit anonymously</input>
				</div>
			}
			<div className="button-container">
				<Button colour="black" isHollow={true} label="Cancel" onClick={this.props.onCancel} />
				<Button colour="pink" label="Submit" type="submit" />
			</div>
		</form>
	}
}

export default withForm(SubmitComicForm, {
	fields: {
		title: {
			label: 'Comic title (leave blank for "Untitled")',
			placeholder: 'Untitled',
			getError: (val) => {
				if(!validator.isLength(val, { max: 30 })) return 'Please enter a shorter title (maximum 30 characters)';
			}
		},
		isAnonymous: {
			label: 'Submit anonymously (you can change this later)',
			type: Util.enum.FieldType.Checkbox
		}
	}
})