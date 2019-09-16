import axios from 'axios';

import iconAvatar from './icons/avatar.svg';
import iconBack from './icons/back.svg';
import iconCancel from './icons/cancel.svg';
import iconChat from './icons/chat.svg';
import iconCopy from './icons/copy.svg';
import iconDislike from './icons/dislike.svg';
import iconDownload from './icons/download.svg';
import iconEnvelope from './icons/envelope.svg';
import iconFirst from './icons/first.svg';
import iconGarbage from './icons/garbage.svg';
import iconLast from './icons/last.svg';
import iconLike from './icons/like.svg';
import iconNext from './icons/next.svg';
import iconShare from './icons/share.svg';
import iconStar from './icons/star.svg';

const Util = {
	auth: {
		_tokenKey: 'auth-token',
		_getToken: () => localStorage.getItem(Util.auth._tokenKey),

		_userId: null,
		_username: null,

		set: (authResult) => {
			authResult.token
				? localStorage.setItem(Util.auth._tokenKey, authResult.token)
				: localStorage.removeItem(Util.auth._tokenKey);

			Util.auth._userId = authResult.userId;
			Util.auth._username = authResult.username;
		},

		clear: () => {
			localStorage.removeItem(Util.auth._tokenKey);

			Util.auth._userId = null;
			Util.auth._username = null;
			window.location.href = "/";
		},

		isAuthenticated: () => !!Util.auth._getToken(),
		getUserId: () => Util.auth._userId,
		getUsername: () => Util.auth._username
	},

	api: {
		post: (endpoint, params = null) => {
			let token = Util.auth._getToken();

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
			Confirm: 2,
			TitleComicModal: 3,
			ShareComicModal: 4
		},

		ComicSortBy: {
			TopRated: 1,
			Newest: 2,
			Random: 3
		}
	},

	event: {
		absorb: (event) => {
			var e = event || window.event;
			e.preventDefault && e.preventDefault();
			e.stopPropagation && e.stopPropagation();
			e.cancelBubble = true;
			e.returnValue = false;
			return false;
		}
	},

	fn: {
		copyToClipboard: (value) => {
			var textArea = document.createElement("textarea");
			textArea.style.position = 'fixed';
			textArea.style.top = 0;
			textArea.style.left = 0;
			textArea.style.width = '2em';
			textArea.style.height = '2em';
			textArea.style.padding = 0;
			textArea.style.border = 'none';
			textArea.style.outline = 'none';
			textArea.style.boxShadow = 'none';
			textArea.style.background = 'transparent';

			textArea.value = value;
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
		}
	},

	icon: {
		avatar: iconAvatar,
		back: iconBack,
		cancel: iconCancel,
		chat: iconChat,
		copy: iconCopy,
		dislike: iconDislike,
		download: iconDownload,
		envelope: iconEnvelope,
		first: iconFirst,
		garbage: iconGarbage,
		last: iconLast,
		like: iconLike,
		next: iconNext,
		share: iconShare,
		star: iconStar
	},

	route: {
		root: 's4ycomic.com',

		home: () => `/`,
		template: (templateId, comicId) => {
			if(!templateId) return Util.route.home();
			return comicId 
				? `/template/${templateId}/comic/${comicId}` 
				: `/template/${templateId}`;
		},
		login: () => `/login`,
		profile: (userId) => `/profile/${userId}`,
		register: () => `/register`,
		forgotPassword: () => `/forgot-password`,
		resetPassword: (token) => `/reset-password/${token}`,
		verify: (token) => `/verify/${token}`
	},

	selector: {
		getRootScrollElement: () => {
			return document.getElementsByClassName('app-container')[0]; 
		}
	}
};

export default Util;