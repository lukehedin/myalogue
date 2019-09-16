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
			title: dbComic.Title || "Untitled",
			templateId: dbComic.TemplateId,
			isAnonymous: dbComic.IsAnonymous,
			userId: dbComic.IsAnonymous ? null : dbComic.UserId,
			rating: dbComic.Rating || 0,
			username: dbComic.IsAnonymous || !dbComic.User ? 'anonymous' : dbComic.User.Username,
			comicDialogues: (dbComic.ComicDialogues || [])
				.sort((cd1, cd2) => cd1.Ordinal - cd2.Ordinal)
				.map(mapper.fromDbComicDialogue),
			voteValue: dbComic.ComicVotes && dbComic.ComicVotes.length === 1
				? dbComic.ComicVotes[0].Value //The current vote the user has given the comic
				: null
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
			title: dbTemplate.Title,
			imageUrl: dbTemplate.ImageUrl,
			unlockedAt: dbTemplate.UnlockedAt,
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