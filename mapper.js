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
			gameId: dbComic.GameId,
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
			gameDialogueId: dbComicDialogue.GameDialogueId,
			value: dbComicDialogue.Value
		}
	},

	fromDbGame: (dbGame) => {
		return {
			gameId: dbGame.GameId,
			description: dbGame.Description,
			imageUrl: dbGame.ImageUrl,
			unlockedAt: dbGame.UnlockedAt,
			gameDialogues: (dbGame.GameDialogues || [])
				.sort((td1, td2) => td1.Ordinal - td2.Ordinal)
				.map(mapper.fromDbGameDialogue)
		}
	},

	fromDbGameDialogue: (dbGameDialogue) => {
		return {
			gameDialogueId: dbGameDialogue.GameDialogueId,
			placeholder: dbGameDialogue.Placeholder,
			ordinal: dbGameDialogue.Ordinal,
			positionX: dbGameDialogue.PositionX,
			positionY: dbGameDialogue.PositionY,
			sizeX: dbGameDialogue.SizeX,
			sizeY: dbGameDialogue.SizeY,
			max: dbGameDialogue.Max
		};
	}
};

module.exports = mapper;