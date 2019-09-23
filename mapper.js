const mapper = {
	fromDbUser: (dbUser, includeSensitiveData = false) => {
		let user = {
			userId: dbUser.UserId,
			username: dbUser.Username,
			createdAt: dbUser.CreatedAt,
			// bio: dbUser.Bio
		};

		if(includeSensitiveData) {
			user.email = dbUser.Email;
			user.lastLoginAt = dbUser.LastLoginAt;
		}

		return user;
	},

	fromDbComic: (dbComic) => {
		return {
			comicId: dbComic.ComicId,
			title: dbComic.Title || "Untitled",
			templateId: dbComic.TemplateId,
			rating: dbComic.Rating || 0,
			comicPanels: (dbComic.ComicPanels || [])
				.sort((cd1, cd2) => cd1.Ordinal - cd2.Ordinal)
				.map(mapper.fromDbComicPanel),
			voteValue: dbComic.ComicVotes && dbComic.ComicVotes.length === 1
				? dbComic.ComicVotes[0].Value //The current vote the user has given the comic
				: null
		}
	},

	fromDbComicPanel: (dbComicPanel) => {
		return {
			comicPanelId: dbComicPanel.ComicPanelId,
			templatePanelId: dbComicPanel.TemplatePanelId,
			value: dbComicPanel.Value,
			userId: dbComicPanel.UserId,
			username: !dbComicPanel.User ? null : dbComicPanel.User.Username
		}
	},

	fromDbTemplate: (dbTemplate) => {
		return {
			templateId: dbTemplate.TemplateId,
			description: dbTemplate.Description,
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
	}
};

module.exports = mapper;