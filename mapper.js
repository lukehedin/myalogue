const enums = require('./enums');

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
			image: dbTemplatePanel.Image,
			textAlignVertical: dbTemplatePanel.TextAlignVertical,
			textAlignHorizontal: dbTemplatePanel.TextAlignHorizontal
		};
	},

	fromDbUserNotification: (dbUserNotification) => {
		//A user notification always requires the Notification object with it. These two layers form a user notification.
		//The UserNotification holds additional data that may be specific to the user. Eg. the amount of additional comments

		let title = '';
		let message = '';

		let valueInt = dbUserNotification.ValueInteger;
		let valueString = dbUserNotification.ValueString;

		let dbRelatedComicId = dbUserNotification.Notification.ComicId;

		switch(dbUserNotification.Notification.Type) {
			case enums.NotificationType.Welcome:
				title = `Welcome!`;
				message = `This is where your notifications appear. You'll get a notification each time a comic you've made a panel for is complete.`;
				break;
			case enums.NotificationType.ComicComment:
				//Might be for a panel creator, or for someone else who commented on a random comic
				message = `${valueString || 'A user'}${valueInt ? ` and ${valueInt} other${valueInt === 1 ? `` : `s`}` : ``} commented on comic #${dbRelatedComicId}.`;
				break;
			case enums.NotificationType.ComicCompleted:
				title = `Comic #${dbRelatedComicId} completed!`
				message = `A comic you made a panel for has been completed. Click here to view the comic.`;
				break;
			case enums.NotificationType.PanelRemoved:
				//This uses valueInt/valueString because it is not actionable and does not need other FK data
				message = `Sorry, a panel you made for comic #${valueInt} was skipped by too many users and has been removed. Your dialogue was: "${valueString}"`;
				break;
			case enums.NotificationType.General:
			default:
				title = dbUserNotification.Notification.Title;
				message = dbUserNotification.Notification.Message;
				break;
		}

		///Actionable if the notification links to a FK item
		let isActionable = !dbUserNotification.ActionedAt 
			&& dbUserNotification.Notification.ComicId;

		return {
			userNotificationId: dbUserNotification.UserNotificationId,
			isSeen: !!dbUserNotification.SeenAt,
			isActionable: isActionable,
			createdAt: dbUserNotification.RenewedAt
				? dbUserNotification.RenewedAt //Notifications can be updated with more recent data
				: dbUserNotification.CreatedAt,
			title: (title || dbUserNotification.Notification.Title || ''),
			message: (message || dbUserNotification.Notification.Message || ''),
			//For actionable links
			comicId: dbUserNotification.Notification.ComicId
		}
	}
};

module.exports = mapper;