import React, { useState } from 'react';
import Util from '../../../Util';

export default function ImageUpload(props) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const changeIsLoading = (newIsUploading) => {
    if (!isUploading && newIsUploading) {
      if (props.onUploadingStart) props.onUploadingStart();
    } else if (isUploading && !newIsUploading) {
      if (props.onUploadingEnd) props.onUploadingEnd();
    }

    setIsUploading(isUploading);
  };

  const onChange = (e) => {
    if (e.target.files.length > 0) {
		changeIsLoading(true);

      let image = e.target.files[0];

      let formData = new FormData();
      if (props.params) {
        Object.keys(props.params).forEach((key) => {
          formData.append(key, props.params[key]);
        });
      }
      formData.append('image', image);

      Util.api
        .postFormData(props.endpoint, formData)
        .then((result) => {
			changeIsLoading(false);

          if (!result.error) {
            if (props.onUploaded) props.onUploaded(result);
          } else {
            setError(result.error);
          }
        })
        .catch((error) => {
          setError(error);
          changeIsLoading(false);
        });
    }
  };

  return (
    <div className="image-upload">
      <label
        className={`button button-md button-black ${
          isUploading ? 'hidden' : ''
        }`}
        htmlFor="image-upload-input"
      >
        <span className="button-label">{props.label || 'Upload image'}</span>
      </label>
      <input
        id="image-upload-input"
        accept="image/*"
        hidden={isUploading}
        type="file"
        name="image"
        onChange={onChange}
      ></input>
      {isUploading ? <p className="sm">Uploading...</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}