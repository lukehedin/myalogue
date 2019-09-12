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

	fromDbTemplate: (dbTemplate) => {
		return {
			name: dbTemplate.Name,
			imageUrl: dbTemplate.ImageUrl,
			templateDialogues: (dbTemplate.TemplateDialogues || [])
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