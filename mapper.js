const mapper = {
	fromDbUser: (dbUser, includeProfileData = false) => {
		let user = {
			userId: dbUser.UserId,
			username: dbUser.Username,
			avatar: {
				character: dbUser.AvatarCharacter,
				expression: dbUser.AvatarExpression,
				colour: dbUser.AvatarColour
			}
		};

		if(includeProfileData) {
			user.createdAt = dbUser.CreatedAt;
			// bio: dbUser.Bio
		}

		//I can't see a use case we'd need to MAP email or other sensitive data
		//Could just use the dbUser

		return user;
	},

	fromDbComic: (dbComic) => {
		return {
			comicId: dbComic.ComicId,
			title: dbComic.Title || "Untitled",
			templateId: dbComic.TemplateId,
			rating: dbComic.Rating || 0,
			hasAnonymous: dbComic.HasAnonymous,
			completedAt: dbComic.CompletedAt,
			comicComments: (dbComic.ComicComments || [])
				.sort((c1, c2) => new Date(c1.CreatedAt) - new Date(c2.CreatedAt))
				.map(mapper.fromDbComicComment),
			comicPanels: (dbComic.ComicPanels || [])
				.sort((cd1, cd2) => cd1.Ordinal - cd2.Ordinal)
				.map(mapper.fromDbComicPanel),
			voteValue: dbComic.ComicVotes && dbComic.ComicVotes.length > 0
				? dbComic.ComicVotes[0].Value //The current vote the user has given the comic
				: null
		}
	},

	fromDbComicPanel: (dbComicPanel) => {
		return {
			comicId: dbComicPanel.ComicId,
			comicPanelId: dbComicPanel.ComicPanelId,
			templatePanelId: dbComicPanel.TemplatePanelId,
			value: dbComicPanel.Value,
			user: dbComicPanel.User ? mapper.fromDbUser(dbComicPanel.User) : null
		};
		
	},

	fromDbComicComment: (dbComicComment) => {
		return {
			comicCommentId: dbComicComment.ComicCommentId,
			value: dbComicComment.Value,
			createdAt: dbComicComment.CreatedAt,
			updatedAt: dbComicComment.UpdatedAt,
			user: dbComicComment.User ? mapper.fromDbUser(dbComicComment.User) : null
		}
	},

	fromDbTemplate: (dbTemplate) => {
		return {
			templateId: dbTemplate.TemplateId,
			name: dbTemplate.Name,
			descriptionHtml: dbTemplate.DescriptionHtml,
			unlockedAt: dbTemplate.UnlockedAt,
			templatePanels: (dbTemplate.TemplatePanels || [])
				.sort((td1, td2) => td1.Ordinal - td2.Ordinal)
				.map(mapper.fromDbTemplatePanel)
		}
	},

	fromDbTemplatePanel: (dbTemplatePanel) => {
		return {
			templatePanelId: dbTemplatePanel.TemplatePanelId,
			placeholder: dbTemplatePanel.Placeholder,
			ordinal: dbTemplatePanel.Ordinal,
			positionX: dbTemplatePanel.PositionX,
			positionY: dbTemplatePanel.PositionY,
			sizeX: dbTemplatePanel.SizeX,
			sizeY: dbTemplatePanel.SizeY,
			max: dbTemplatePanel.Max,
			image: dbTemplatePanel.Image
		};
	},

	fromDbUserNotification: (dbUserNotification) => {
		let isActionable = !dbUserNotification.ActionedAt 
			&& !!dbUserNotification.Notification.ComicId;

		return {
			userNotificationId: dbUserNotification.UserNotificationId,
			isSeen: !!dbUserNotification.SeenAt,
			isActionable: isActionable,
			createdAt: dbUserNotification.CreatedAt,
			title: dbUserNotification.Notification.Title,
			message: dbUserNotification.Notification.Message,
			comicId: dbUserNotification.Notification.ComicId
		}
	}
};

module.exports = mapper;