import common from './common';

const mapper = {
	fromDbUser: (dbUser) => {
		let user = {
			userId: dbUser.UserId,
			username: dbUser.Username,
			createdAt: dbUser.CreatedAt,
			avatar: {
				character: dbUser.AvatarCharacter,
				expression: dbUser.AvatarExpression,
				colour: dbUser.AvatarColour
			}
		};

		//I can't see a use-case we'd need to MAP email or other sensitive data - just use the dbUser
		return user;
	},

	fromDbComic: (dbComic) => {
		return {
			comicId: dbComic.ComicId,
			title: dbComic.Title || "Untitled",
			templateId: dbComic.TemplateId,
			rating: dbComic.Rating || 0,
			isAnonymous: dbComic.IsAnonymous,
			panelCount: dbComic.PanelCount,
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
		const censorChars = ['#', '*', '!', '@', '%', '$'];
		let value = dbComicPanel.Value || '';
		
		if(dbComicPanel.CensoredAt) {
			let newValue = '';
			let lastCensorChar = null;

			for(let i = 0; i < value.length; i++) {
				let char = value[i];
				if(char && char.trim()) {
					let possibleCensorChars = censorChars.filter(cChar => cChar !== lastCensorChar);
					let censorChar = possibleCensorChars[common.getRandomInt(0, possibleCensorChars.length - 1)];
					newValue += censorChar;
					lastCensorChar = censorChar;
				} else {
					newValue += char;
				}
			}

			value = newValue;
		}

		return {
			comicId: dbComicPanel.ComicId,
			comicPanelId: dbComicPanel.ComicPanelId,
			templatePanelId: dbComicPanel.TemplatePanelId,
			isCensored: dbComicPanel.CensoredAt,
			value: value,
			user: dbComicPanel.User && !dbComicPanel.CensoredAt
				? mapper.fromDbUser(dbComicPanel.User) 
				: null
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
			textAlignHorizontal: dbTemplatePanel.TextAlignHorizontal,
			textColour: dbTemplatePanel.TextColour
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
			case common.enums.NotificationType.Welcome:
				title = `Welcome!`;
				message = `This is where your notifications appear. You'll get a notification each time a comic you've made a panel for is complete.`;
				break;

			case common.enums.NotificationType.ComicComment:
				//Might be for a panel creator, or for someone else who commented on a random comic
				message = `${valueString || 'A user'}${valueInt ? ` and ${valueInt} other${valueInt === 1 ? `` : `s`}` : ``} commented on comic #${dbRelatedComicId}.`;
				break;

			case common.enums.NotificationType.ComicCommentMention:
				message = `${valueString || 'A user'} mentioned you in a comment on comic #${dbRelatedComicId}.`;
				break;

			case common.enums.NotificationType.ComicCompleted:
				title = `Comic #${dbRelatedComicId} completed!`
				message = `A comic you made a panel for has been completed. Click here to view the comic.`;
				break;
				
			case common.enums.NotificationType.PanelRemoved:
				//This uses valueInt/valueString because it is not actionable and does not need other FK data
				message = `Sorry, a panel you made for comic #${valueInt} was skipped by too many users and has been removed.\n\nYour dialogue was: "${valueString}"`;
				break;

			case common.enums.NotificationType.PanelCensored:
				message = `A panel you made for comic #${valueInt} has been censored. Too many censored panels will result in a ban.\n\nYour dialogue was: "${valueString}"`;
				break;

			case common.enums.NotificationType.General:
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

export default mapper;