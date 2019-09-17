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
import iconMenu from './icons/menu.svg';
import iconNext from './icons/next.svg';
import iconShare from './icons/share.svg';
import iconStar from './icons/star.svg';

const Util = {
	context: {
		_tokenKey: 'auth-token',
		_getToken: () => localStorage.getItem(Util.context._tokenKey),

		_userId: null,
		_username: null,
		_referenceData: null,

		set: (authResult) => {
			authResult.token
				? localStorage.setItem(Util.context._tokenKey, authResult.token)
				: localStorage.removeItem(Util.context._tokenKey);

			Util.context._userId = authResult.userId;
			Util.context._username = authResult.username;
			Util.context._referenceData = authResult.referenceData;
		},

		clear: () => {
			localStorage.removeItem(Util.context._tokenKey);

			Util.context._userId = null;
			Util.context._username = null;
			Util.context._referenceData = null;
			window.location.href = "/";
		},

		isAuthenticated: () => !!Util.context._getToken(),
		getUserId: () => Util.context._userId,
		getUsername: () => Util.context._username,

		//Refdata
		getTemplates: () => Util.context._referenceData.templates(),
		getTemplateById: (templateId) => Util.context._referenceData.templates.find(template => templateId === template.templateId),
		getLatestTemplate: () => Util.context._referenceData.templates[Util.context._referenceData.templates.length - 1],
		getLatestTemplateId: () => Util.context.getLatestTemplate().templateId
	},

	api: {
		post: (endpoint, params = null) => {
			let token = Util.context._getToken();

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
			SubmitComicModal: 3,
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
		menu: iconMenu,
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
		hallOfFame: () => `/hall-of-fame`,
		leaderboard: () => `/leaderboard`,
		login: () => `/login`,
		profile: (userId) => `/profile/${userId}`,
		register: () => `/register`,
		forgotPassword: () => `/forgot-password`,
		resetPassword: (token) => `/reset-password/${token}`,
		verify: (token) => `/verify/${token}`,
		about: () => `/about`,
		terms: () => `/terms`,
		privacy: () => `/privacy`
	},

	selector: {
		getRootScrollElement: () => {
			return document.getElementsByClassName('app-container')[0]; 
		}
	}
};

export default Util;