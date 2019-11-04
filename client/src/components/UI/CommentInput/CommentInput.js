import React, { Component } from 'react';
import Textarea from 'react-textarea-autosize';
import Util from '../../../Util';

import Button from '../Button/Button';

export default class CommentInput extends Component {
	constructor(props) {
		super(props);

		this.state = {
			value: this.props.value || '',
			isLoading: false
		};

		this.inputRef = React.createRef();

		this.onInputChange = this.onInputChange.bind(this);
		this.onInputTouchEnd = this.onInputTouchEnd.bind(this);
		this.submit = this.submit.bind(this);
	}
	focus(withValue) {
		if(withValue) {
			this.setState({
				value: withValue
			});
		}

		this.inputRef.focus();
	}
	onInputChange(e) {
		this.setState({
			value: e.target.value
		});
	}
	submit() {
		this.setState({ 
			isLoading: true
		});

		if(this.props.onSubmit) this.props.onSubmit(this.state.value, () => {
			//Reset on complete
			this.setState({
				isLoading: false,
				value: ''
			});
		});
	}
	onInputTouchEnd(e) {
		//Mobile keyboard bug was bumping this out of view on focus, this tries to correct it
		if(Util.context.isTouchDevice()) {
			let textarea = e.target;
			
			let scrollEl = Util.selector.getRootScrollElement();
			scrollEl.style.overflowY = 'hidden';

			setTimeout(() => {
				scrollEl.style.overflowY = 'auto';
				if(textarea && document.activeElement === textarea) {
					if(textarea) textarea.scrollIntoViewIfNeeded();
				}
			}, 500); // 500 gives enough time for the keyboard to pop up.
		}
	}
	render() {
		return <div className="comment-input">
			{this.state.isLoading ? <div className="loader masked"></div> : null}
			<Textarea inputRef={tag => (this.inputRef = tag)} placeholder={this.props.placeholder || 'Add a comment'} onChange={this.onInputChange} value={this.state.value} onTouchEnd={this.onInputTouchEnd} />
			<div className="button-container">
				{this.props.onCancel 
					? <Button onClick={this.props.onCancel} colour="black" size="sm" isHollow={true} label='Cancel' isDisabled={this.props.isLoading} />
					: null
				}
				<Button onClick={this.submit} colour="pink" size="sm" label={this.props.buttonLabel || 'Post'} isDisabled={this.props.isLoading || !this.state.value} />
			</div>
		</div>;
	}
}