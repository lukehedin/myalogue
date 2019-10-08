import axios from 'axios';
import ReactGA from 'react-ga';
import moment from 'moment';

import iconBack from './icons/back.svg';
import iconBell from './icons/bell.svg';
import iconBin from './icons/bin.svg';
import iconCancel from './icons/cancel.svg';
import iconCog from './icons/cog.svg';
import iconComment from './icons/comment.svg';
import iconContextMenu from './icons/contextmenu.svg';
import iconCopy from './icons/copy.svg';
import iconDislike from './icons/dislike.svg';
import iconDownload from './icons/download.svg';
import iconFirst from './icons/first.svg';
import iconGit from './icons/git.svg';
import iconHeart from './icons/heart.svg';
import iconHome from './icons/home.svg';
import iconInstagram from './icons/instagram.svg'
import iconLast from './icons/last.svg';
import iconLike from './icons/like.svg';
import iconMail from './icons/mail.svg';
import iconMenu from './icons/menu.svg';
import iconNext from './icons/next.svg';
import iconPanels from './icons/panels.svg';
import iconQuestion from './icons/question.svg';
import iconShare from './icons/share.svg';
import iconStar from './icons/star.svg';
import iconUser from './icons/user.svg';

const Util = {
	context: {
		_tokenKey: 'auth-token',
		_getToken: () => localStorage.getItem(Util.context._tokenKey),

		_userId: null,
		_username: null,
		_avatar: null,

		_isDev: null,
		_referenceData: null,

		set: (authResult) => {
			authResult.token
				? localStorage.setItem(Util.context._tokenKey, authResult.token)
				: localStorage.removeItem(Util.context._tokenKey);

			if(authResult.referenceData) {
				//Add a lookup of templatepanels to the referencedata
				authResult.referenceData.templatePanelLookup = {};
				authResult.referenceData.templates.forEach(template => {
					template.templatePanels.forEach(templatePanel => {
						authResult.referenceData.templatePanelLookup[templatePanel.templatePanelId] = templatePanel;
					});
				});
			}

			Util.context._userId = authResult.userId;
			Util.context._username = authResult.username;
			Util.context._avatar = authResult.avatar;
			Util.context._isDev = authResult.isDev;
			Util.context._referenceData = authResult.referenceData;

			Util.analytics.set('userId', authResult.userId);
		},

		clear: (noRedirect = false) => {
			localStorage.removeItem(Util.context._tokenKey);

			Util.context._userId = null;
			Util.context._username = null;
			Util.context._isDev = null;
			Util.context._referenceData = null;

			Util.analytics.set('userId', null);
			
			if(!noRedirect) window.location.href = "/";
		},

		isDev: () => Util.context._isDev,
		isAuthenticated: () => !!Util.context.getUserId(), // Cannot use token, as anons also use this
		
		getUserId: () => Util.context._userId,
		getUsername: () => Util.context._username,
		getUserAvatar: () => Util.context._avatar && Util.context._avatar.character && Util.context._avatar.expression && Util.context._avatar.colour
			? Util.context._avatar
			: Util.avatar.getPseudoAvatar(Util.context.getUserId()),

		//Refdata
		getTemplates: () => Util.context._referenceData.templates,
		getTemplateById: (templateId) => Util.context._referenceData.templates.find(template => templateId === template.templateId),
		getLatestTemplate: () => Util.context._referenceData.templates[Util.context._referenceData.templates.length - 1],
		getTemplatePanelById: (templatePanelId) => Util.context._referenceData.templatePanelLookup[templatePanelId],

		getTopComic: () => Util.context._referenceData.topComic,

		//localstored, device only settings (the ones that do not matter if cleared)
		setting: {
			_showAnonymousComicsKey: 'setting-show-anonymous-comics',

			getShowAnonymousComics: () => {
				let setting = localStorage.getItem(Util.context.setting._showAnonymousComicsKey);
				return setting === "true";
			},
			setShowAnonymousComics: (showAnonymousComics) => localStorage.setItem(Util.context.setting._showAnonymousComicsKey, showAnonymousComics)
		}
	},

	analytics: {
		init: () => {
			ReactGA.initialize('UA-92026212-3');

			//This won't happen because isDev aint set yet
			if(Util.context.isDev()) console.log(`GA:INIT`);
		},

		set: (property, value) => {
			ReactGA.set({ [property]: value });
			
			if(Util.context.isDev()) console.log(`GA:SET - ${property}:${value}`);
		},

		event: (eventCategory, eventAction, value = null, nonInteraction = false) => {
			ReactGA.event({
				category: eventCategory,
				action: eventAction,
				nonInteraction: nonInteraction,
				value: value
			});

			if(Util.context.isDev()) console.log(`GA:EVENT - ${eventCategory}:${eventAction}`);
		},
		
		page: () => {
			let path = Util.route.getCurrent();

			ReactGA.pageview(path);
			if(Util.context.isDev()) console.log(`GA:PAGE - ${path}`);
		},

		modal: (modalName) => {
			ReactGA.modalview(modalName);
			if(Util.context.isDev()) console.log(`GA:MODAL - ${modalName}`);
		}
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
		none: arr => !Util.array.any(arr),
		random: arr => arr[Util.random.getRandomInt(0, arr.length - 1)]
	},

	avatar: {
		getExpressionCount: () => 10,
		getCharacterCount: () => 6,
		getColourCount: () => Object.keys(Util.avatar.colourLookup).length,

		getPseudoAvatar: (userId) => {
			return {
				expression: (userId % Util.avatar.getExpressionCount()) + 1,
				character: (userId % Util.avatar.getCharacterCount()) + 1,
				colour: (userId % Util.avatar.getColourCount()) + 1
			}
		},

		colourLookup: {
			1: `f26522`, //orange
			2: `f0ba00`, //yellow
			3: `00d131`, //green
			4: `00b6e7`, //blue
			5: `6600f2`, //purple
		}
	},

	enum: {
		toString: (enumObj, enumValue) => Object.keys(enumObj).find(key => enumObj[key] === enumValue),

		FieldType: {
			Text: 1,
			Textarea: 2,
			Checkbox: 3,
			Dropdown: 4
		},
		
		ModalType: {
			Alert: 1,
			Confirm: 2,
			ShareComicModal: 3
		},

		NotificationType: {
			General: 1,
			ComicComplete: 2,
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
		},

		window: {
			_blurredAt: null,

			init: () => {
				window.addEventListener('blur', () => {
					Util.event.window._blurredAt = new Date();
					Util.analytics.event('Window', 'WindowBlur');
				});
				window.addEventListener('focus', () => {
					//Refresh if it's been more than 15 minutes of inactivity
					if(Util.event.window._blurredAt && moment(Util.event.window._blurredAt).add(15, 'minutes').toDate() < new Date()) {
						window.location.reload();
					}
					Util.event.window._blurredAt = null;
					Util.analytics.event('Window', 'WindowFocus');
				});
			}

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

	format: {
		pluralise: (arrayOrCount, singular, plural) => {
			if(!plural) plural = singular + 's';
			let count = Array.isArray(arrayOrCount) ? arrayOrCount.length : arrayOrCount;
			return count === 1 ? singular : plural;
		}
	},

	icon: {
		back: iconBack,
		bell: iconBell,
		bin: iconBin,
		cancel: iconCancel,
		cog: iconCog,
		comment: iconComment,
		contextMenu: iconContextMenu,
		copy: iconCopy,
		dislike: iconDislike,
		download: iconDownload,
		first: iconFirst,
		git: iconGit,
		heart: iconHeart,
		home: iconHome,
		instagram: iconInstagram,
		last: iconLast,
		like: iconLike,
		mail: iconMail,
		menu: iconMenu,
		next: iconNext,
		panels: iconPanels,
		question: iconQuestion,
		share: iconShare,
		star: iconStar,
		user: iconUser
	},

	route: {
		getHost: () =>  window.location.host,
		getCurrent: () => window.location.pathname,
		isCurrently: (route) => Util.route.getCurrent() === route,

		home: () => `/`,
		settings: () => `/settings`,
		template: (templateId) => templateId ? `/template/${templateId}` : `/template`,
		comic: (comicId) => `/comic/${comicId}`,
		topComics: () => `/top-comics`,
		leaderboard: () => `/leaderboard`,
		login: () => `/login`,
		howToPlay: () => `/how-to-play`,
		profile: (userId) => userId ? `/profile/${userId}` : `/profile`,
		register: () => `/register`,
		forgotPassword: () => `/forgot-password`,
		setPassword: (token) => `/set-password/${token}`,
		verify: (token) => `/verify/${token}`,
		about: () => `/about`,
		termsOfService: () => `/terms-of-service`,
		privacyPolicy: () => `/privacy-policy`,
		play: (templateId) => templateId ? `/play/${templateId}` : `/play`
	},

	random: {
		getRandomInt: (min, max) => {
			max = max + 1; //The max below is EXclusive, so we add one to it here to make it inclusive
			return Math.floor(Math.random() * (max - min)) + min;
		}
	},

	selector: {
		getApp: () => {
			return document.getElementsByClassName('app')[0];
		},

		getRootScrollElement: () => {
			return document.getElementsByClassName('app-container')[0]; 
		}
	}
};

export default Util;