import axios from 'axios';

const Util = {
	auth: {
		_tokenKey: 'auth-token',

		_userId: null,
		_username: null,

		setToken: token => localStorage.setItem(Util.auth._tokenKey, token),
		getToken: () => localStorage.getItem(Util.auth._tokenKey),

		setUserDetails: (userId, username) => {
			Util.auth._userId = userId;
			Util.auth._username = username;
		},
		getUserId: () => Util.auth._userId,
		getUsername: () => Util.auth._username,

		logout: () => {
			Util.auth.setToken(null);
			Util.auth.setUserDetails(null, null);
			window.location.href = "/";
		}
	},

	api: {
		post: (endpoint, params = null) => {
			let token = Util.auth.getToken();

			return new Promise((resolve, reject) => {
				axios.post(endpoint, params, {
					headers: token
						? { Authorization: token }
						: { }
				})
				.then(response => resolve(response.data))
				.catch(err => {
					console.log(err);
					reject(err);
				});
			});
		}
	},

	array: {
		any: arr => arr && arr.length > 0,
		none: arr => !Util.any(arr)
	},

	enum: {
		FieldType: {
			Text: 1,
			Textarea: 2,
			Checkbox: 3,
			Dropdown: 4
		}
	},

	route: {
		home: () => `/`,
		login: () => `/login`,
		profile: (userId) => `/profile/${userId}`,
		comic: (comicId) => `/comic/${comicId}`,
		template: (templateId) => `/template/${templateId}`,
		register: () => `/register`,
		forgotPassword: () => `/forgot-password`,
		resetPassword: (token) => `/reset-password/${token}`
	}
};

export default Util;