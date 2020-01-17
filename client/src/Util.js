import React from 'react';
import ReactHtmlParser from 'react-html-parser';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ReactGA from 'react-ga';
import { detect as detectBrowser } from 'detect-browser';
import isTouchDevice from 'is-touch-device';
import linkifyHtml  from 'linkifyjs/html';
import escape from 'escape-html';

import iconBack from './icons/back.svg';
import iconBell from './icons/bell.svg';
import iconBin from './icons/bin.svg';
import iconCancel from './icons/cancel.svg';
import iconCog from './icons/cog.svg';
import iconComment from './icons/comment.svg';
import iconContextMenu from './icons/contextmenu.svg';
import iconCopy from './icons/copy.svg';
import iconDiscord from './icons/discord.svg';
import iconDislike from './icons/dislike.svg';
import iconDownload from './icons/download.svg';
import iconFacebook from './icons/facebook.svg';
import iconFirst from './icons/first.svg';
import iconFlag from './icons/flag.svg';
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
import iconReddit from './icons/reddit.svg';
import iconShare from './icons/share.svg';
import iconStar from './icons/star.svg';
import iconTwitter from './icons/twitter.svg';
import iconUser from './icons/user.svg';

const Util = {
	//One of the bare few env variables that can be used client side.
	isDev: process.env.NODE_ENV === 'development',

	// Context and ref data

	context: {
		_tokenKey: 'auth-token',
		_getToken: () => localStorage.getItem(Util.context._tokenKey),

		_user: null,

		_groupUsers: [],

		_templates: [],
		_templatePanelLookup: {},
		
		_achievements: null,

		set: (newContext) => {
			//The token will have an anonId or a userId
			if(newContext.token) {
				newContext.token
					? localStorage.setItem(Util.context._tokenKey, newContext.token)
					: localStorage.removeItem(Util.context._tokenKey);
			}

			if(newContext.user) {
				Util.context._user = newContext.user;
				Util.analytics.set('userId', newContext.user.userId);
			}

			if(newContext.groupUsers) {
				Util.context._groupUsers = newContext.groupUsers;
			}

			if(newContext.templates) {
				Util.context._templates = newContext.templates;
				//Add a lookup of templatepanels to the context
				Util.context._templatePanelLookup = {};
				Util.context._templates.forEach(template => {
					template.templatePanels.forEach(templatePanel => {
						Util.context._templatePanelLookup[templatePanel.templatePanelId] = templatePanel;
					});
				});
			}

			if(newContext.achievements) {
				Util.context._achievements = newContext.achievements;
			}
		},

		clear: (noRefresh = false) => {
			localStorage.removeItem(Util.context._tokenKey);

			Util.context._user = null;
			Util.analytics.set('userId', null);
			
			if(!noRefresh) window.location.href = "/";
		},

		isAuthenticated: () => !!Util.context._user, // Cannot use token, as anons also use this
		isUserId: (userId) => Util.context.isAuthenticated() && Util.context.getUserId() === userId,

		getUser: () => {
			//A basic user object useful for updating client side UI (so the name, avatar etc can still be shown)
			return {
				userId: Util.context.getUserId(),
				username: Util.context.getUsername(),
				avatar: Util.context.getUserAvatar()
			};
		},
		getUserId: () => Util.context._user.userId,
		getUsername: () => Util.context._user.username,
		getUserAvatar: () => Util.userAvatar.getForUser(Util.context._user),

		getGroupUsers: () => Util.context._groupUsers || [],
		getGroupUserByGroupId: (groupId) => Util.context.getGroupUsers().find(gu => gu.groupId === groupId),
		isInGroup: (groupId) => !!Util.context.getGroupUserByGroupId(groupId),
		isGroupAdmin: (groupId) => {
			let groupUser = Util.context.getGroupUserByGroupId(groupId);
			return groupUser && groupUser.isGroupAdmin;
		},

		getTemplates: () => Util.context._templates,
		getLatestTemplate: () => Util.context._templates[Util.context._templates.length - 1],
		getTemplateById: (templateId) => {
			let template = Util.context._templates.find(template => templateId === template.templateId);
			if(!template) Util.context.clear(); //Context is outdated, do a refresh.
	
			return template;
		},
		getTemplatePanelById: (templatePanelId) => {
			let templatePanel = Util.context._templatePanelLookup[templatePanelId];
			if(!templatePanel) Util.context.clear(); //Context is outdated, do a refresh.
	
			return templatePanel;
		},
	
		getAchievements: () => Util.context._achievements,
		getAchievementByType: (achievementType) => Util.context.getAchievements().find(achievement => achievement.type === achievementType),

		//localstored, device only settings (the ones that do not matter if cleared)
		setting: {
			_showAnonymousComicsKey: 'setting-show-anonymous-comics',

			getShowAnonymousComics: () => {
				let setting = localStorage.getItem(Util.context.setting._showAnonymousComicsKey);
				return setting === "true";
			},
			setShowAnonymousComics: (showAnonymousComics) => localStorage.setItem(Util.context.setting._showAnonymousComicsKey, showAnonymousComics)
		},

		//Device and browser info
		isBrowserSupported: () => detectBrowser().name !== "ie",
		isTouchDevice: () => isTouchDevice()
	},

	// Functions and static data

	analytics: {
		init: () => {
			if(Util.isDev) {
				console.log(`GA:INIT`);
			} else {
				ReactGA.initialize('UA-92026212-3');
			}
		},

		set: (property, value) => {
			if(Util.isDev) {
				console.log(`GA:SET - ${property}:${value}`);
			} else {
				ReactGA.set({ [property]: value });
			}
		},

		event: (eventCategory, eventAction, value = null, nonInteraction = false) => {
			if(Util.isDev) {
				console.log(`GA:EVENT - ${eventCategory}:${eventAction}`);
			} else {
				ReactGA.event({
					category: eventCategory,
					action: eventAction,
					nonInteraction: nonInteraction,
					value: value
				});
			}
		},
		
		page: () => {
			let path = Util.route.getCurrent();

			if(Util.isDev) {
				console.log(`GA:PAGE - ${path}`);
			} else {
				ReactGA.pageview(path);
			}
		},

		modal: (modalName) => {
			if(Util.isDev) {
				console.log(`GA:MODAL - ${modalName}`);
			} else {
				ReactGA.modalview(modalName);
			}
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
					if(err.response && err.response.status === 401) {
						//Authentication failure, clear cache and refresh
						Util.context.clear();
					} else {
						reject(err);
					}
				});
			});
		},

		postFormData: (endpoint, formData) => {
			let token = Util.context._getToken();

			return new Promise((resolve, reject) => {
				axios.post(endpoint, formData, {
					headers: {
						Authorization: token,
						'accept': 'application/json',
						'Accept-Language': 'en-US,en;q=0.8',
						'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
					}
				})
				.then(response => resolve(response.data))
				.catch((err) => {
					console.log(err);
					if(err.response && err.response.status === 401) {
						//Authentication failure, clear cache and refresh
						Util.context.clear();
					} else {
						reject(err);
					}
				});
			});
		}
	},

	array: {
		any: arr => arr && arr.length > 0,
		none: arr => !Util.array.any(arr),
		random: arr => arr[Util.random.getRandomInt(0, arr.length - 1)],
		shuffle: arr => {
		
			var currentIndex = arr.length, temporaryValue, randomIndex;

			// While there remain elements to shuffle...
			while (0 !== currentIndex) {
		  
			  // Pick a remaining element...
			  randomIndex = Math.floor(Math.random() * currentIndex);
			  currentIndex -= 1;
		  
			  // And swap it with the current element.
			  temporaryValue = arr[currentIndex];
			  arr[currentIndex] = arr[randomIndex];
			  arr[randomIndex] = temporaryValue;
			}
		  
			return arr;
		}
	},

	enums: {
		toString: (enumObj, enumValue) => Object.keys(enumObj).find(key => enumObj[key] === enumValue),

		FieldType: {
			Text: 1,
			Textarea: 2,
			Checkbox: 3,
			Dropdown: 4,
			ImageUpload: 5
		},
		
		ModalType: {
			Alert: 1,
			Confirm: 2,
			ShareComicModal: 3,
			ReportComicPanelModal: 4
		},

		NotificationType: {
			General: 1,
			Welcome: 2,
			ComicCompleted: 3,
			PanelRemoved: 4,
			ComicComment: 5,
			PanelCensored: 6,
			ComicCommentMention: 7,
			AchievementUnlocked: 8
		},

		ComicSortBy: {
			TopAll: 1,
			Newest: 2,
			Random: 3,
			TopToday: 4,
			TopWeek: 5,
			TopMonth: 6,
			Hot: 7
		},

		GroupSortBy: {
			Popular: 1,
			Newest: 2,
			Alphabetical: 3,
			Mutual: 4
		},

		TextAlignVertical: {
			Bottom: 1,
			Top: 2,
			Middle: 3
		},

		TextAlignHorizontal: {
			Middle: 1,
			Left: 2,
			Right: 3
		},

		TextColour: {
			Black: 1,
			White: 2
		}
	},

	event: {
		absorb: (event) => {
			let e = event || window.event;
			e.preventDefault && e.preventDefault();
			e.stopPropagation && e.stopPropagation();
			e.cancelBubble = true;
			e.returnValue = false;
			return false;
		}
	},

	fn: {
		copyToClipboard: (value) => {
			let textArea = document.createElement("textarea");
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
		},

		userStringToSafeHtml: (str = "", allowMentions = false) => {
			if(!str) return str;

			// Most importantly, escape html.
			// External components convert this string to live html
			str = escape(str);

			//Everything below this point will be valid html

			//Add user mention links (regex also on server)
			if(allowMentions) {
				str = str.replace(/\B@[a-z0-9]+/gi, (userMention) => {
					let username = userMention.replace('@', '');
					return `<a target="_self" href="${Util.route.profile(username)}">${userMention}</a>`;
				});
			}
			
			//Bold
			str = str.replace(/\*\*(\S(.*?\S)?)\*\*/gm, '<b>$1</b>');
			
			//Add hyperlinks
			//The internal ternary's here are for safety, but are usually overrridden by Link components outside this fn
			return linkifyHtml(str, {
				target: (href) => Util.route.isLinkInternal(href) ? '_self' : '_blank',
				attributes: (href) =>  Util.route.isLinkInternal(href) ? {} : { rel: 'noopener nofollow' }
			});
		},

		userStringToSafeComponent: (str = "", allowMentions = false) => {
			let html = Util.format.userStringToSafeHtml(str, allowMentions);
			let components = ReactHtmlParser(html);

			for(let i = 0; i < components.length; i++) {
				let component = components[i];
	
				if(component.type === "a" && Util.route.isLinkInternal(component.props.href)) {
					components[i] = <Link key={i} to={Util.route.toInternalLink(component.props.href)}>{component.props.children}</Link>;
				}
			}
	
			return <div>{components}</div>;
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
		discord: iconDiscord,
		dislike: iconDislike,
		download: iconDownload,
		facebook: iconFacebook,
		first: iconFirst,
		flag: iconFlag,
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
		reddit: iconReddit,
		share: iconShare,
		star: iconStar,
		twitter: iconTwitter,
		user: iconUser
	},

	route: {
		getHost: () =>  window.location.host,
		getCurrent: () => window.location.pathname,
		isCurrently: (route) => Util.route.getCurrent() === route,
		
		isLinkInternal: (link) => {
			if(link.startsWith('/')) return true;
			let urlLink = new URL(link);
			return urlLink.host === window.location.host;
		},
		toInternalLink: (link) => {
			if(link.startsWith('/')) return link;
			let urlLink = new URL(link);
			return urlLink.pathname;
		},

		home: () => `/`,
		achievements: () => `/achievements`,
		settings: () => `/settings`,
		group: (groupId) => `/group/${groupId}`,
		groups: () => `/groups`,
		groupEditor: (groupId) => (groupId ? `/group-editor/${groupId}` : `/group-editor`),
		templates: () => `/templates`,
		template: (templateId) => templateId ? `/template/${templateId}` : `/template`,
		comic: (comicId) => `/comic/${comicId}`,
		leaderboards: () => `/leaderboards`,
		login: () => `/login`,
		howToPlay: () => `/how-to-play`,
		profile: (userId) => (userId ? `/profile/${userId}` : `/profile`),
		register: () => `/register`,
		forgotPassword: () => `/forgot-password`,
		setPassword: (token) => `/set-password/${token}`,
		verify: (token) => `/verify/${token}`,
		about: () => `/about`,
		termsOfService: () => `/terms-of-service`,
		privacyPolicy: () => `/privacy-policy`,
		play: () => `/play`,

		withQueryParams: (route, queryParams) => {
			let queryString = '';

			Object.keys(queryParams).forEach(key => {
				if(queryString !== '') queryString += '&';
				queryString += key + '=' + queryParams[key]; 
			});

			return queryString ? `${route}?${queryString}` : route; 
		}
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

		getAppInner: () => {
			return document.getElementsByClassName('app-inner')[0];
		},
		
		getRootScrollElement: () => {
			return document.getElementsByClassName('app-container')[0]; 
		}
	},

	userAvatar: {
		getExpressionCount: () => 10,
		getCharacterCount: () => 6,
		getColourCount: () => Object.keys(Util.userAvatar.colourLookup).length,

		getForUser: (user) => {
			//If the user has a url, or the user has all 3 s4y avatar settings, it's good to go
			return user && user.avatar && (user.avatar.url || (user.avatar.character && user.avatar.expression && user.avatar.colour))
				? user.avatar
				: {
					expression: (user.userId % Util.userAvatar.getExpressionCount()) + 1,
					character: (user.userId % Util.userAvatar.getCharacterCount()) + 1,
					colour: (user.userId % Util.userAvatar.getColourCount()) + 1
				};
		},

		colourLookup: {
			1: `e87e00`, //orange
			2: `f0ba00`, //yellow
			3: `00d131`, //green
			4: `00b6e7`, //blue
			5: `6600f2`, //purple
			6: `c400b8`, //pink
			7: `ff3600` //red
		}
	}
};

export default Util;