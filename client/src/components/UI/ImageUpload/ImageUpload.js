import React, { Component } from 'react';
import Util from '../../../Util';

export default class ImageUpload extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isUploading: false
		};

		this.onChange = this.onChange.bind(this);
	}
	onChange(event) {
		if(event.target.files.length > 0) {
			this.setState({
				isUploading: true
			});

			let image = event.target.files[0];

			let formData = new FormData();
			formData.append('image', image);
			if(this.props.id) formData.append('id', this.props.id);
			Util.api.postFormData(this.props.endpoint, formData)
				.then(result => {
					this.setState({
						isUploading: false
					});

					if(!result.error) {
						if(this.props.onUpload) this.props.onUpload(result);
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
						error,
						isUploading: false,
					});
				});
		}
	}
	render() {
		return <div className="image-upload">
			<input disabled={this.state.isUploading} type="file" name="image" onChange={this.onChange}></input>
			{this.state.error ? <p className="error">{this.state.error}</p> : null}
		</div>
	}
}