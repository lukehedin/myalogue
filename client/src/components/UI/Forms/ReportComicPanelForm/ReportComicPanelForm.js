import React, { Component } from 'react';
import validator from 'validator';
import Util from '../../../../Util';

import asForm from '../asForm';

import Button from '../../Button/Button';

class ReportComicPanelForm extends Component {
	render() {
		return <form onSubmit={this.props.submitForm}>
			{this.props.getField('reportComicPanelId')}
			<div className="button-container">
				<Button isHollow={true} label="Cancel" onClick={this.props.onCancel} />
				<Button colour="black" label="Report" type="submit" />
			</div>
		</form>
	}
}

export default asForm(ReportComicPanelForm, {
	fields: {
		reportComicPanelId: {
			type: Util.enums.FieldType.Dropdown,
			getOptions: formData => [...formData.comic.comicPanels.filter(comicPanel => !comicPanel.isCensored && (!comicPanel.user || !Util.context.isUserId(comicPanel.user.userId)))],
			valueProp: 'comicPanelId',
			isBlankAllowed: true,
			blankLabel: 'Select a panel to report',
			displayPropFn: (record) => {
				return `${record.user ? record.user.username : 'anonymous'}: ${record.value}`;
			}
		}
	}
})