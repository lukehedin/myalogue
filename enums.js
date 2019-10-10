const enums = {
	NotificationType: {
		General: 1,
		Welcome: 2,
		ComicCompleted: 3,
		PanelRemoved: 4, // valueInteger = comicId, valueString = dialogue from removed panel
		ComicComment: 5, // valueInteger = number of OTHER commenters
	}
};

module.exports = enums;