import React, { Component } from 'react';
import Util from '../../../Util';
import { connect } from 'react-redux';
import { closeModal } from '../../../redux/actions';
import { Link } from 'react-router-dom';

import Button from '../Button/Button';
import CopyButton from '../CopyButton/CopyButton';
import TitleComicForm from '../Forms/TitleComicForm/TitleComicForm';
import ComicTitle from '../ComicTitle/ComicTitle';

class Modal extends Component {
	constructor(props) {
		super(props);
	}
	close() {
		this.props.closeModal(this.props.modal.modalId);
	}
	render() {
		let modal = this.props.modal;

		let modalClass = "";
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
			case Util.enum.ModalType.TitleComicModal:
				modalClass = "modal-submit-comic";
				modalContent = <div className="">
					<TitleComicForm 
						formData={{
							...modal.comic
						}}
						onSubmit={(form, formData) => {
							if(this.onSubmit) this.onSubmit(formData);
							this.close();
						}}
					/>
					{!Util.auth.isAuthenticated()
						?<div>
							<h6>Your comic will be submitted anonymously and you won't be able to claim ownership of it.</h6>
							<h6>If you <Link to={Util.route.register()}>register</Link>, you can be recorded as the author.</h6>
						</div>
						: <div>
							<input type="checkbox" value={false}>Submit anonymously</input>
						</div>
					}
				</div>
				break;
			case Util.enum.ModalType.ShareComicModal:
				let comicLink = Util.route.root + Util.route.template(modal.comic.templateId, modal.comic.comicId);

				modalClass = 'modal-share-comic';
				modalContent = <div className="share-comic">
					<h5>Share comic</h5>
					<h3><ComicTitle comic={modal.comic} /></h3>
					<input readOnly={true} defaultValue={comicLink}></input>
					<CopyButton toCopy={comicLink} />
					<Button colour="black" isHollow={true} href={modal.comicImageSrc} download={"test"} label={'Download image'} leftIcon={Util.icon.download} download={modal.comic.title} />
				</div>
				break;
			default:
				break;
		}

		return <div className={`modal ${modalClass}`}>
			{modalTitle ? <div>{modalTitle}</div> : null}
			{modalContent}
		</div>
	}
}

export default connect(null, { closeModal })(Modal);