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
	
			let [authResult, groupUsers, templates, achievements] = await Promise.all(authPromises);

			return {
				...authResult,
				templates,
				achievements,
				groupUsers
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

			let [groupUsers, newTemplates] = await Promise.all([
				services.Group.GetGroupUsersForUserId(userId),
				services.Template.GetNew(existingTemplateIds)
			]);

			return {
				groupUsers,
				newTemplates
			};
		},

		getPlayInfo: async (req, services) => {
			let userId = req.userId; //Might be null

			let comicsInProgress = await services.Comic.GetComicsInProgress(userId);

			//Can hold additional play info
			return {
				comicsInProgress
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
				services.User.GetUserAchievements(requestedUser.userId)
			]);

			return {
				user: requestedUser,
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
			let userId = req.userId; // May be null
			let groupId = req.body.groupId;

			let [group, groupUsers, groupChallenges, groupStats] = await Promise.all([
				await services.Group.GetById(groupId, userId),
				await services.Group.GetGroupUsers(groupId),
				await services.Group.GetGroupChallenges(groupId),
				await services.Group.GetStatsForGroup(groupId)
			]);

			return {
				group,
				groupUsers,
				groupChallenges,
				groupStats
			};
		},

		getGroups: async (req, services) => {
			let userId = req.userId; // May be null

			let forUserId = req.body.forUserId; //Do not confuse
			let search = req.body.search;
			let sortBy = req.body.sortBy;
			let offset = req.body.offset;
			let limit = req.body.limit;

			return await services.Group.GetGroups(userId, forUserId, search, sortBy, offset, limit);
		},

		joinGroup: async (req, services) => {
			let userId = req.userId;

			let groupId = req.body.groupId;
			
			return await services.Group.JoinGroup(userId, groupId);
		},

		actionGroupInvite: async (req, services) => {
			let userId = req.userId;

			let groupInviteId = req.body.groupInviteId;
			let isAccepting = req.body.isAccepting;

			return await services.Group.ActionGroupInvite(userId, groupInviteId, isAccepting);
		},

		//Gets a comic in progress or starts new
		play: async (req, services) => {
			let userId = req.userId;
			let anonId = req.anonId;

			let skippedComicId = req.body.skippedComicId;

			//Only use options if logged in
			let templateId = userId ? req.body.templateId : null;
			let groupId = userId ? req.body.groupId : null;
			let groupChallengeId = userId ? req.body.groupChallengeId : null;

			if(!userId && !anonId) throw 'No identity id supplied';

			let playBundle = await services.Play.Play(userId, anonId, templateId, groupId, groupChallengeId);

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

		getPendingGroupInfoForUser: async(req, services) => {
			//Returns a list of pending requests and invites
			let userId = req.userId;
			
			return await services.Group.GetPendingGroupInfoForUser(userId);
		},

		saveUserAvatar: async (req, services) => {
			let userId = req.userId;

			let avatar = req.body.avatar;

			return await services.User.SaveAvatar(userId, avatar);
		},
		
		uploadUserAvatar: async (req, services) => {
			let userId = req.userId;
			let file = req.file;

			await services.User.SaveUserAvatarUrl(userId, file.url);

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

		saveGroup: async (req, services) => {
			let userId = req.userId;
			let adminOfGroupIds = req.adminOfGroupIds;

			let group = req.body.group;

			//This check only matters if the group has a groupId, otherwise it is a new group
			if(group.groupId && !adminOfGroupIds.includes(group.groupId)) throw 'Not a group admin';

			return await services.Group.SaveGroup(userId, group);
		},

		uploadGroupAvatar: async (req, services) => {
			let adminOfGroupIds = req.adminOfGroupIds;

			let groupId = req.body.groupId;

			if(!groupId || !adminOfGroupIds.includes(groupId)) throw 'Not a group admin';
			
			let file = req.file;

			await services.Group.SaveGroupAvatarUrl(groupId, file.url);
			
			return file.url;
		},

		getPendingGroupInfoForGroup: async (req, services) => {
			let adminOfGroupIds = req.adminOfGroupIds;

			let groupId = req.body.groupId;

			if(!groupId || !adminOfGroupIds.includes(groupId)) throw 'Not a group admin';

			return await services.Group.GetPendingGroupInfoForGroup(groupId);
		},

		inviteUserToGroup: async (req, services) => {
			let userId = req.userId;
			let memberOfGroupIds = req.memberOfGroupIds;

			let groupId = req.body.groupId;

			if(!memberOfGroupIds.includes(groupId)) throw 'Not a group member';

			let username = req.body.username;

			return await services.Group.InviteToGroupByUsername(userId, username, groupId);
		},

		actionGroupRequest: async (req, services) => {
			let adminOfGroupIds = req.adminOfGroupIds;
			
			let groupId = req.body.groupId;
			
			if(!groupId || !adminOfGroupIds.includes(groupId)) throw 'Not a group admin';

			let groupRequestId = req.body.groupRequestId;
			let isApproving = req.body.isApproving;

			return await services.Group.ActionGroupRequest(groupId, groupRequestId, isApproving);
		},

		leaveGroup: async (req, services) => {
			let userId = req.userId;
			let memberOfGroupIds = req.memberOfGroupIds;
			
			let groupId = req.body.groupId;

			if(!memberOfGroupIds.includes(groupId)) throw 'Not a group member';

			return await services.Group.RemoveUserFromGroup(userId, groupId);
		},

		removeUserFromGroup: async (req, services) => {
			let adminOfGroupIds = req.adminOfGroupIds;

			let groupId = req.body.groupId;

			if(!groupId || !adminOfGroupIds.includes(groupId)) throw 'Not a group admin';

			let removeUserId = req.body.removeUserId;

			return await services.Group.RemoveUserFromGroup(removeUserId, groupId);
		},
		

		getGroupForEdit: async (req, services) => {
			let adminOfGroupIds = req.adminOfGroupIds;

			let groupId = req.body.groupId;

			if(!groupId || !adminOfGroupIds.includes(groupId)) throw 'Not a group admin';

			return await services.Group.GetById(groupId);
		},

		createGroupChallenge: async(req, services) => {
			let adminOfGroupIds = req.adminOfGroupIds;
			
			let groupId = req.body.groupId;
			
			if(!groupId || !adminOfGroupIds.includes(groupId)) throw 'Not a group admin';

			let challenge = req.body.challenge;

			return await services.Group.CreateGroupChallenge(groupId, challenge);
		},

		removeGroupChallenge: async(req, services) => {
			let adminOfGroupIds = req.adminOfGroupIds;
			
			let groupId = req.body.groupId;
			
			if(!groupId || !adminOfGroupIds.includes(groupId)) throw 'Not a group admin';

			let groupChallengeId = req.body.groupChallengeId;

			return await services.Group.RemoveGroupChallenge(groupId, groupChallengeId);
		}
	}
};