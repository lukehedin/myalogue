import React, { Component } from 'react';
import Util from '../../../Util';
import { connect } from 'react-redux';
import { closeModal } from '../../../redux/actions';

import Button from '../Button/Button';
import ShareComicPanel from '../ShareComicPanel/ShareComicPanel';
import SubmitComicForm from '../Forms/SubmitComicForm/SubmitComicForm';
import ReactSVG from 'react-svg';

class Modal extends Component {
	constructor(props){
		super(props);

		this.close = this.close.bind(this);
	}
	close() {
		this.props.closeModal(this.props.modal.modalId);
	}
	render() {
		let modal = this.props.modal;

		let modalClass = "";
		let modalIcon = null;
		let modalTitle = modal.title;
		let modalContent = modal.content;

		switch(modal.type){
			case Util.enum.ModalType.Alert:
				modalClass = "modal-prompt";
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
				modalClass = "modal-prompt";
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
			case Util.enum.ModalType.SubmitComicModal:
				modalTitle = "Submit comic";
				modalClass = "modal-submit-comic";
				modalContent = <div className="">
					<SubmitComicForm 
						formData={{
							...modal.comic
						}}
						onSubmit={(form, formData) => {
							form.setLoading(true);

							Util.api.post('/api/submitComic', {
								comic: formData
							})
							.then(result => {
								if(!result.error) {
									//Slap on user data(db doesn't use this during create)
									if(result.userId) result.username = Util.context.getUsername();

									if(modal.onSubmit) modal.onSubmit(result);
									this.close();
								} else {
									form.setLoading(false);
									form.setOverallError(result.error);
								}
							});
						}}
						onCancel={this.close}
					/>
				</div>
				break;
			case Util.enum.ModalType.ShareComicModal:
				modalTitle = "Share comic";
				modalClass = 'modal-share-comic';
				modalContent = <ShareComicPanel comic={modal.comic} comicDataUrl={modal.comicDataUrl} />
				break;
			default:
				break;
		}

		return <div className={`modal ${modalClass}`}>
			{modalTitle || modalIcon 
				? <div className="modal-header">
					{modalIcon ? <ReactSVG className="modal-icon" src={modalIcon} /> : null}
					{modalTitle ? <h5 className="modal-title">{modalTitle}</h5> : null}
					<div className="flex-spacer"></div>
					<ReactSVG className="modal-close-icon" src={Util.icon.cancel} onClick={this.close} />
				</div> 
				: null
			}
			<div className="modal-content">
				{modalContent}
			</div>
		</div>
	}
}

export default connect(null, { closeModal })(Modal);