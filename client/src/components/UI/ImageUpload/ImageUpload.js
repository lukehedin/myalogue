import React, { Component } from 'react';
import Util from '../../../Util';

export default class ImageUpload extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isUploading: false
		};

		this.onChange = this.onChange.bind(this);
		this.setIsUploading = this.setIsUploading.bind(this);
	}
	setIsUploading(isUploading) {
		if(!this.state.isUploading && isUploading) {
			if(this.props.onUploadingStart) this.props.onUploadingStart();
		} else if(this.state.isUploading && !isUploading) {
			if(this.props.onUploadingEnd) this.props.onUploadingEnd();
		}

		this.setState({
			isUploading: isUploading
		});
	}
	onChange(e) {
		if(e.target.files.length > 0) {
			this.setIsUploading(true);

			let image = e.target.files[0];

			let formData = new FormData();
			if(this.props.params) {
				Object.keys(this.props.params).forEach(key => {
					formData.append(key, this.props.params[key]);
				});
			}
			formData.append('image', image);

			Util.api.postFormData(this.props.endpoint, formData)
				.then(result => {
					this.setIsUploading(false);

					if(!result.error) {
						if(this.props.onUploaded) this.props.onUploaded(result);
					} else {
						this.setState({
							image: null,
							error: result.error
						});
					}
				})
				.catch(error => {
					this.setState({
						image: null,
						error
					});

					this.setIsUploading(false);
				});
		}
	}
	render() {
		return <div className="image-upload">
			<label className={`button button-md button-black ${this.state.isUploading ? 'hidden' : ''}`} htmlFor="image-upload-input">
				<span className="button-label">{this.props.label || 'Upload image'}</span>
			</label>
			<input id="image-upload-input" accept="image/*" hidden={this.state.isUploading} type="file" name="image" onChange={this.onChange}></input>
			{this.state.isUploading ? <p className="sm">Uploading...</p> : null}
			{this.state.error ? <p className="error">{this.state.error}</p> : null}
		</div>
	}
}