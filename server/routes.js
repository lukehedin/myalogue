import common from './common';

export default {
	public: {
		authenticate: async (req, services) => {
			if(common.config.IsUnderMaintenance) return { isUnderMaintenance: true };

			let userId = req.userId;
			let anonId = req.anonId;

			let referenceDataPromises = [
				services.Comic.GetAllTemplatesWhereUnlockedWithPanels(),
				services.Comic.GetTopComic(userId)
			];
	
			let [templates, topComic] = await Promise.all(referenceDataPromises);

			let result = {
				referenceData: {
					templates: templates,
					topComic: topComic
				}
			}

			let authResult = await services.User.Authenticate(userId, anonId);

			return {
				...result,
				...authResult
			};
		},
	
		login: async (req, services) => {
			let emailUsername = req.body.emailUsername.trim().toLowerCase();
			let password = req.body.password;
	
			return await services.User.Login(emailUsername, password);
		},
	
		register: async (req, services) => {
			let email = req.body.email;
			let username = req.body.username;
			let password = req.body.password;

			return await services.User.Register(email, username, password);
		},

		verifyAccount: async (req, services) => {
			let token = req.body.token;

			return await services.User.VerifyAccount(token);
		},
	
		forgotPassword: async (req, services) => {
			let emailUsername = req.body.emailUsername.trim().toLowerCase();

			return await services.User.ForgotPassword(emailUsername);
		},

		setPassword: async (req, services) => {
			let token = req.body.token;
			let password = req.body.password;

			return await services.User.SetPassword(token, password);
		},

		getComicById: async (req, services) => {
			let userId = req.userId; //Might be null
			let comicId = req.body.comicId;

			let comic = await services.Comic.GetById(comicId, userId);
			
			if(!comic) throw 'Comic not found.';

			//Don't reveal an incomplete comic
			return comic.completedAt
				? {
					isComicCompleted: true,
					comic
				} : {
					isComicCompleted: false,
					totalPanelCount: comic.panelCount,
					completedPanelCount: (comic.comicPanels || []).length
				};
		},
		
		getComics: async (req, services) => {
			let forUserId = req.userId; //Might be null

			let templateId = req.body.templateId;
			let authorUserId = req.body.authorUserId;
			let ignoreComicIds = req.body.ignoreComicIds;
			let completedAtBefore = req.body.completedAtBefore;
			let includeAnonymous = req.body.includeAnonymous;
			let sortBy = req.body.sortBy;
			let offset = req.body.offset;
			let limit = req.body.limit;

			return await services.Comic.GetComics(forUserId, templateId, authorUserId, ignoreComicIds, completedAtBefore, includeAnonymous, sortBy, offset, limit);
		},

		getTopComics: async (req, services) => {
			return await services.Comic.GetTopComics();
		},

		getUser: async (req, services) => {
			let requestedUserId = req.body.requestedUserId; //do not confuse
			let requestedUsername = req.body.requestedUsername;

			let user = requestedUsername
				? await services.User.GetByUsername(requestedUsername)
				: await services.User.GetById(requestedUserId);

			if(!user) throw 'User not found.';

			let userStats = await services.Comic.GetStatsForUser(user.userId);

			return {
				user: user,
				userStats: userStats
			};
		},

		getComicsInProgressCount: async (req, services) => {
			return await services.Comic.GetComicsInProgressCount();
		},

		//Gets a comic in progress or starts new
		play: async (req, services) => {
			let userId = req.userId;
			let anonId = req.anonId;

			let skippedComicId = req.body.skippedComicId;
			let templateId = req.body.templateId;

			if(!userId && !anonId) throw 'No identity id supplied';

			let playBundle = await services.Play.Play(userId, anonId, templateId);
			
			//We process a skipped comic after the play so that our existing lock remains until after the above
			//The await here is debatable, but it will ensure the skip is processed before another one comes through
			if(skippedComicId) await services.Play.SkipComic(userId, anonId, skippedComicId);

			return playBundle;
		},
		
		submitComicPanel: async (req, services) => {
			let userId = req.userId;
			let anonId = req.anonId;

			let comicId = req.body.comicId;
			let dialogue = req.body.dialogue;

			return await services.Play.SubmitComicPanel(userId, anonId, comicId, dialogue);
		}
	},

	private: {

		voteComic: async (req, services) => {
			let userId = req.userId;
			let comicId = req.body.comicId;
			let value = req.body.value;

			//Value can only be 1, 0, -1
			if(value > 1 || value < -1) throw 'Invalid vote value supplied.';

			return await services.Comic.VoteComic(userId, comicId, value);
		},

		reportComicPanel: async (req, services) => {
			let userId = req.userId;
			let isAdmin = req.isAdmin;

			let comicId = req.body.comicId;
			let comicPanelId = req.body.comicPanelId;

			await services.Comic.ReportComicPanel(userId, isAdmin, comicId, comicPanelId);
			
			return;
		},

		postComicComment: async (req, services) => {
			let userId = req.userId;

			let comicId = req.body.comicId;
			let value = req.body.value;

			return await services.Comic.PostComicComment(userId, comicId, value);
		},

		updateComicComment: async (req, services) => {
			let userId = req.userId;

			let comicCommentId = req.body.comicCommentId;
			let value = req.body.value;

			return await services.Comic.UpdateComicComment(userId, comicCommentId, value);
		},

		deleteComicComment: async (req, services) => {
			let userId = req.userId;

			let comicCommentId = req.body.comicCommentId;

			return await services.Comic.DeleteComicComment(userId, comicCommentId);
		},

		getNotifications: async (req, services) => {
			let userId = req.userId;

			let lastCheckedAt = req.body.lastCheckedAt;

			return await services.Notification.GetNotificationsForUserId(userId, lastCheckedAt);
		},

		seenNotifications: async (req, services) => {
			let userId = req.userId;
			let userNotificationIds = req.body.userNotificationIds;

			services.Notification.SeenUserNotificationsByIds(userId, userNotificationIds);

			return;
		},

		actionedUserNotification: async (req, services) => {
			let userId = req.userId;
			let userNotificationId = req.body.userNotificationId;

			services.Notification.ActionedUserNotificationById(userId, userNotificationId);

			return;
		},

		saveAvatar: async (req, services) => {
			let userId = req.userId;
			
			let avatar = req.body.avatar;

			return await services.User.SaveAvatar(userId, avatar);
		},

		changePassword: async (req, services) => {
			//Must be logged in
			let userId = req.userId;

			let currentPassword = req.body.currentPassword;
			let newPassword = req.body.newPassword;
			
			return await services.User.ChangePassword(userId, currentPassword, newPassword);
		}
	}
};