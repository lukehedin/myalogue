export default interface IDbComic {
	ComicId: number
	TemplateId: number
	CompletedAt: Date
	PanelCount: number
	Rating: number
	FavouriteCount: number
	HotRank: number
	LockedAt: Date // locked while editing (1 min)
	LeaderboardTopAt: Date,
	LeaderboardRating: number

	//Anonymous fields
	IsAnonymous: boolean
	LockedByAnonId: string
	LastAuthorAnonId: string
	
	//Used for display
	Title: string //First line of dialogue?

	GroupId?: number
	Group: IDbComicGroup
	GroupChallenge: IDbComicGroupChallenge
	ComicPanels: IDbComicPanel[]
	ComicComments: IDbComicComment[]
	ComicVotes: IDbComicVote[]
	ComicFavourites: IDbComicFavourite[]
	UserAchievements: IDbUserAchievement[]
}