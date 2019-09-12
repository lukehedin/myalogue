import React, { Component } from 'react';
import Util from '../../../Util';
import Button from '../Button/Button';
import { connect } from 'react-redux';
import { closeModal } from '../../../redux/actions';

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
				break;
			case Util.enum.ModalType.Confirm:
				modalContent = <div>
					{modalContent}
					<Button label={modal.yesLabel || 'Yes'} onClick={() => {
						this.close();
						if(modal.yesFn) modal.yesFn();
					}} />
					<Button label={modal.noLabel || 'No'} onClick={() => {
						this.close();
						if(modal.noFn) modal.noFn();
					}} />
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