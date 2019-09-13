import axios from 'axios';

import iconAvatar from './icons/avatar.svg';
import iconBack from './icons/back.svg';
import iconCancel from './icons/cancel.svg';
import iconChat from './icons/chat.svg';
import iconCopy from './icons/copy.svg';
import iconDislike from './icons/dislike.svg';
import iconEnvelope from './icons/envelope.svg';
import iconGarbage from './icons/garbage.svg';
import iconLike from './icons/like.svg';
import iconNext from './icons/next.svg';
import iconShare from './icons/share.svg';
import iconStar from './icons/star.svg';

const Util = {
	auth: {
		_tokenKey: 'auth-token',

		_userId: null,
		_username: null,

		set: (authResult) => {
			localStorage.setItem(Util.auth._tokenKey, authResult.token);

			Util.auth._userId = authResult.userId;
			Util.auth._username = authResult.username;
		},

		clear: () => {
			localStorage.setItem(Util.auth._tokenKey, null);

			Util.auth._userId = null;
			Util.auth._username = null;
			window.location.href = "/";
		},

		getToken: () => localStorage.getItem(Util.auth._tokenKey),
		getUserId: () => Util.auth._userId,
		getUsername: () => Util.auth._username
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
		none: arr => !Util.array.any(arr)
	},

	enum: {
		FieldType: {
			Text: 1,
			Textarea: 2,
			Checkbox: 3,
			Dropdown: 4
		},
		
		ModalType: {
			Alert: 1,
			Confirm: 2
		}
	},

	icon: {
		avatar: iconAvatar,
		back: iconBack,
		cancel: iconCancel,
		chat: iconChat,
		copy: iconCopy,
		dislike: iconDislike,
		envelope: iconEnvelope,
		garbage: iconGarbage,
		like: iconLike,
		next: iconNext,
		share: iconShare,
		star: iconStar
	},

	route: {
		home: () => `/`,
		login: () => `/login`,
		profile: (userId) => `/profile/${userId}`,
		comic: (comicId) => `/comic/${comicId}`,
		template: (templateId) => `/template/${templateId}`,
		register: () => `/register`,
		forgotPassword: () => `/forgot-password`,
		resetPassword: (token) => `/reset-password/${token}`,
		verify: (token) => `/verify/${token}`
	}
};

export default Util;