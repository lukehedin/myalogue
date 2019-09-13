import React, { Component } from 'react';
import Util from '../../../Util';
import { connect } from 'react-redux';
import { closeModal } from '../../../redux/actions';

import Button from '../Button/Button';

class Modal extends Component {
	constructor(props) {
		super(props);
	}
	close() {
		this.props.closeModal(this.props.modal.modalId);
	}
	render() {
		let modal = this.props.modal;

		let modalTitle = modal.title;
		let modalContent = modal.content;

		switch(modal.type){
			case Util.enum.ModalType.Alert:
				modalContent = <div>
					{modalContent}
					<div className="button-container">
						<Button size="sm" label={modal.okLabel || 'OK'} onClick={() => {
							this.close();
						}} />
					</div>
				</div>
				break;
			case Util.enum.ModalType.Confirm:
				modalContent = <div>
					{modalContent}
					<div className="button-container">
						<Button size="sm" isHollow={true} label={modal.noLabel || 'No'} onClick={() => {
							this.close();
							if(modal.noFn) modal.noFn();
						}} />
						<Button size="sm" label={modal.yesLabel || 'Yes'} onClick={() => {
							this.close();
							if(modal.yesFn) modal.yesFn();
						}} />
					</div>
				</div>
				break;
			default:
				break;
		}

		return <div className="modal">
			{modalTitle ? <div>{modalTitle}</div> : null}
			{modalContent}
		</div>
	}
}

export default connect(null, { closeModal })(Modal);