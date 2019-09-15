const mapper = {
	fromDbUser: (dbUser, includeSensitiveData = false) => {
		let user = {
			userId: dbUser.UserId,
			username: dbUser.Username
		};

		if(includeSensitiveData) {
			user.email = dbUser.Email;
		}

		return user;
	},

	fromDbComic: (dbComic) => {
		return {
			comicId: dbComic.ComicId,
			templateId: dbComic.TemplateId,
			userId: dbComic.UserId,
			rating: dbComic.Rating || 0,
			username: dbComic.User ? dbComic.User.Username : 'anonymous',
			comicDialogues: (dbComic.ComicDialogues || [])
				.sort((cd1, cd2) => cd1.Ordinal - cd2.Ordinal)
				.map(mapper.fromDbComicDialogue)
		}
	},

	fromDbComicDialogue: (dbComicDialogue) => {
		return {
			// comicDialogueId: dbComicDialogue.ComicDialogueId,
			templateDialogueId: dbComicDialogue.TemplateDialogueId,
			value: dbComicDialogue.Value
		}
	},

	fromDbTemplate: (dbTemplate) => {
		return {
			templateId: dbTemplate.TemplateId,
			name: dbTemplate.Name,
			ordinal: dbTemplate.Ordinal,
			imageUrl: dbTemplate.ImageUrl,
			templateDialogues: (dbTemplate.TemplateDialogues || [])
				.sort((td1, td2) => td1.Ordinal - td2.Ordinal)
				.map(mapper.fromDbTemplateDialogue)
		}
	},

	fromDbTemplateDialogue: (dbTemplateDialogue) => {
		return {
			templateDialogueId: dbTemplateDialogue.TemplateDialogueId,
			placeholder: dbTemplateDialogue.Placeholder,
			ordinal: dbTemplateDialogue.Ordinal,
			positionX: dbTemplateDialogue.PositionX,
			positionY: dbTemplateDialogue.PositionY,
			sizeX: dbTemplateDialogue.SizeX,
			sizeY: dbTemplateDialogue.SizeY,
			max: dbTemplateDialogue.Max
		};
	}
};

module.exports = mapper;