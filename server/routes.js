import common from './common';

export default {
	public: {
		authenticate: async (req, services) => {
			if(common.config.IsUnderMaintenance) return { isUnderMaintenance: true };

			let userId = req.userId;
			let anonId = req.anonId;

			let authPromises = [
				services.User.Authenticate(userId, anonId),
				services.Group.GetGroupUsersForUserId(userId),
				services.Template.GetAll(),
				services.Achievement.GetAll()
			];
	
			let [authResult, groups, templates, achievements] = await Promise.all(authPromises);

			return {
				...authResult,
				templates,
				achievements,
				groups
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

		ping: async (req, services) => {
			//Checks if any reference data has updated
			let userId = req.userId; //May be null

			let existingTemplateIds = req.body.existingTemplateIds;

			let [groups, newTemplates] = await Promise.all([
				services.Group.GetGroupUsersForUserId(userId),
				services.Template.GetNew(existingTemplateIds)
			]);

			return {
				groups,
				newTemplates
			};
		},

		getPlayInfo: async (req, services) => {
			let userId = req.userId; //Might be null
			
			let comicsInProgress = await services.Comic.GetComicsInProgress(userId);
			let lastComicStartedAt = null;
			if (userId) {
				lastComicStartedAt = await services.User.GetLastComicStartedAt(userId);
			}

			return {
				comicsInProgress,
				lastComicStartedAt
			}
		},

		getComic: async (req, services) => {
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

		getTopComic: async (req, services) => {
			let forUserId = req.userId;

			let templateId = req.body.templateId;

			return await services.Comic.GetTopComic(templateId, forUserId);
		},
		
		getComics: async (req, services) => {
			let forUserId = req.userId; //Might be null

			let templateId = req.body.templateId;
			let authorUserId = req.body.authorUserId;
			let groupId = req.body.groupId;
			let ignoreComicIds = req.body.ignoreComicIds;
			let completedAtBefore = req.body.completedAtBefore;
			let includeAnonymous = req.body.includeAnonymous;
			let sortBy = req.body.sortBy;
			let offset = req.body.offset;
			let limit = req.body.limit;

			return await services.Comic.GetComics(forUserId, templateId, authorUserId, groupId, ignoreComicIds, completedAtBefore, includeAnonymous, sortBy, offset, limit);
		},

		getLeaderboards: async (req, services) => {
			return await services.Comic.getLeaderboards();
		},

		getUser: async (req, services) => {
			let possibleRequestedUserId = req.body.requestedUserId; //do not confuse
			let possibleRequestedUsername = req.body.requestedUsername;

			let requestedUser = possibleRequestedUsername
				? await services.User.GetByUsername(possibleRequestedUsername)
				: await services.User.GetById(possibleRequestedUserId);

			if(!requestedUser) throw 'User not found.';

			let [userStats, userAchievements, groups] = await Promise.all([
				services.User.GetStatsForUser(requestedUser.userId),
				services.User.GetUserAchievements(requestedUser.userId),
				services.Group.GetGroups(requestedUser.userId)
			]);

			return {
				user: requestedUser,
				groups,
				userStats,
				userAchievements,
				userAchievementProgress: {
					[common.enums.AchievementType.LotsOfTemplates]: Object.keys(userStats.templateUsageLookup).length,
					[common.enums.AchievementType.LotsOfLastPanels]: userStats.lastPanelCount,
					[common.enums.AchievementType.LotsOfFirstPanels]: userStats.firstPanelCount,
					[common.enums.AchievementType.LotsOfComics]: userStats.comicCount,
					[common.enums.AchievementType.HighTotalRating]: userStats.comicTotalRating,
					[common.enums.AchievementType.LotsOfRatings]: userStats.ratingCount,
					[common.enums.AchievementType.LotsOfRatingsForOthers]: userStats.ratingCountForOthers
				}
			};
		},

		getGlobalAchievements: async (req, services) => {
			return await services.Achievement.GetGlobalAchievements();
		},

		getGroup: async (req, services) => {
			let groupId = req.body.groupId;

			let group = await services.Group.GetById(groupId);
			let groupUsers = await services.Group.GetGroupUsers(groupId);
			let comicCount = await services.Group.GetGroupComicCount(groupId);

			return {
				...group,
				groupUsers,
				comicCount
			};
		},

		//Gets a comic in progress or starts new
		play: async (req, services) => {
			let userId = req.userId;
			let anonId = req.anonId;

			let skippedComicId = req.body.skippedComicId;
			let templateId = userId ? req.body.templateId : null; //Only use templateId if logged in

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

	//Includes userId
	user: {
		voteComic: async (req, services) => {
			let userId = req.userId;
			let comicId = req.body.comicId;
			let value = req.body.value;

			//Value can only be 1, 0, -1
			if(value > 1 || value < -1) throw 'Invalid vote value supplied.';

			await services.Comic.VoteComic(userId, comicId, value);

			return;
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


		changePassword: async (req, services) => {
			//Must be logged in
			let userId = req.userId;

			let currentPassword = req.body.currentPassword;
			let newPassword = req.body.newPassword;
			
			return await services.User.ChangePassword(userId, currentPassword, newPassword);
		},

		getGroupsInfo: async(req, services) => {
			//Returns a list of groups, pending requests and invites for a user
			let userId = req.userId;
			
			return await services.Group.GetGroupsInfoForUser(userId);
		},

		saveUserAvatar: async (req, services) => {
			let userId = req.userId;

			let avatar = req.body.avatar;

			return await services.User.SaveAvatar(userId, avatar);
		},
		
		uploadUserAvatar: async (req, services) => {
			let userId = req.userId;
			let file = req.file;

			await services.User.SaveAvatarUrl(userId, file.url);

			return file.url;
		},

		removeUserAvatar: async (req, services) => {
			let userId = req.userId;

			await services.User.RemoveAvatarUrl(userId);

			return;
		}
	},

	//Includes group permissions (adminOfGroupIds, memberOfGroupIds)
	group: {
		uploadGroupAvatar: async (req, services) => {

		},

		saveGroup: async (req, services) => {
			let userId = req.userId;

			let group = req.body.group;

			return await services.Group.SaveGroup(userId, group);
		}
	}
};