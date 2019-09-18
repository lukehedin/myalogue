import React, { Component } from 'react';
import Util from '../../../Util';

export default function withForm(WrappedForm, formConfig) {
	return class extends Component {
		constructor(props){
			super(props);
			
			let formData = this.props.formData || {};
			Object.keys(formConfig.fields).forEach(fieldName => {
				//TODO get values from querystring if possible
				if(!formData[fieldName]) formData[fieldName] = formConfig.fields[fieldName].type === Util.enum.FieldType.Checkbox ? false : '';
			});

			this.state = {
				isLoading: false,
				
				formData: formData,
				formErrors: {},
				formOverallError: null
			};

			this.formWrapperRef = React.createRef();

			this.submitForm = this.submitForm.bind(this);
			this.validateForm = this.validateForm.bind(this);
			this.updateFormData = this.updateFormData.bind(this);
			this.getField = this.getField.bind(this);
		}
		componentDidMount() {
			let formWrapperEl = this.formWrapperRef.current;
			if(formWrapperEl) {
				let autoFocusEls = formWrapperEl.getElementsByClassName('auto-focus');
				if(autoFocusEls[0]) autoFocusEls[0].focus();
			}
		}
		setLoading(isLoading) {
			this.setState({
				isLoading: isLoading
			});
		}
		submitForm(e) {
			e.preventDefault();
			let isValid = this.validateForm();
			if(isValid) this.props.onSubmit(this, this.state.formData);
		}
		validateForm() {
			let formErrors = {};
			let formOverallError = null;

			Object.keys(formConfig.fields).forEach(fieldName => {
				let fieldConfig = formConfig.fields[fieldName];
				let error = fieldConfig.getError
					? fieldConfig.getError(this.state.formData[fieldName], this.state.formData)
					: null;

				if(error) {
					formErrors = {
						...formErrors,
						[fieldName]: error
					};
				}
			});

			if(formConfig.getOverallError) formOverallError = formConfig.getOverallError(this.state.formData);

			this.setState({ formErrors, formOverallError });

			return formOverallError || !Util.array.any(Object.keys(formErrors));
		}
		setOverallError(error) {
			this.setState({
				formOverallError: error
			});
		}
		updateFormData(fieldName, value) {
			this.setState({
				formData: {
					...this.state.formData,
					[fieldName]: value
				},
				formErrors: {
					...this.state.formErrors,
					[fieldName]: null
				}
			})
		}
		getField(fieldName) {
			let fieldConfig = formConfig.fields[fieldName];

			let field = null;

			switch(fieldConfig.type) {
				case Util.enum.FieldType.Textarea:
					field = <div>textarea todo</div>;
					break;
				case Util.enum.FieldType.Checkbox:
					field = <input 
						type="checkbox" 
						onChange={(e) => this.updateFormData(fieldName, e.target.checked)}
						value={this.state.formData[fieldName]}
					/>;
					break;
				default:
					field = <input 
						className={`${fieldConfig.isAutoFocus ? 'auto-focus' : ''}`}
						placeholder={fieldConfig.placeholder || null}
						onChange={(e) => this.updateFormData(fieldName, e.target.value)} 
						type={fieldConfig.isPassword ? "password" : "text"} 
						value={this.state.formData[fieldName]} />;
					break;
			}

			let fieldError = this.state.formErrors[fieldName];

			return <div className={`field-container ${!!fieldError ? 'error' : ''}`}>
				<label>{fieldConfig.label}</label>
				{field}
				{!!fieldError ? <div className="field-error">{fieldError}</div> : null}
			</div>;
		}
		render() {
			return <div ref={this.formWrapperRef} className="form-wrapper">
				{this.state.isLoading ? <div className="loader masked"></div> : null}
				<WrappedForm 
					formData={this.state.formData} 
					getField={this.getField}
					submitForm={this.submitForm}
					{...this.props} />
				{this.state.formOverallError ? <div className="field-error">{this.state.formOverallError}</div> : null}
			</div>
		}
	}
}