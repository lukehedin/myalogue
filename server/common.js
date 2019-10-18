
import dotenv from 'dotenv';
if(process.env.NODE_ENV !== 'production') dotenv.config();

const getIntegerEnvSettingOrDefault = (settingKey, defaultVal = 0) => process.env[settingKey] ? parseInt(process.env[settingKey]) : defaultVal;

//Comon functions and env config, no imports allowed
export default {
	getRandomInt: (min, max) => {
		max = max + 1; //The max below is EXclusive, so we add one to it here to make it inclusive
		return Math.floor(Math.random() * (max - min)) + min;
	},

	//Used for non-serious errors that have UI feedback (often in forms)
	getErrorResult: (error) => {
		return { error: error };
	},
	
	enums: {
		NotificationType: {
			General: 1,
			Welcome: 2,
			ComicCompleted: 3,
			PanelRemoved: 4, // valueInteger = comicId, valueString = dialogue from removed panel
			ComicComment: 5, // valueInteger = number of OTHER commenters
			PanelCensored: 6, // valueInteger = comicId, valueString = dialogue from reported panel
		}
	},

	config: {
		Host: 's4ycomic.com',
		Port: process.env.PORT || 5000,
	
		JwtSecretKey: process.env.JWT_SECRET_KEY,
		SaltRounds: 10,
		
		IsDev: process.env.NODE_ENV === 'development',
		IsDevelopmentScript: process.env.IS_DEVELOPMENT_SCRIPT === "true",
		IsUnderMaintenance: process.env.IS_UNDER_MAINTENANCE === 'true',
	
		DatabaseUrl: process.env.DATABASE_URL,
	
		SendgridApiKey: process.env.SENDGRID_API_KEY,
		DevEmail: process.env.DEV_EMAIL,
		ForbiddenUserNames: ['admin', 'administrator', 'mod', 'moderator', 'help', 'contact', 'anonymous', 'anon', 'root', 'owner'],
	
		//Amount of time to re-request email verification OR password reset
		AccountEmailResetHours: getIntegerEnvSettingOrDefault('ACCOUNT_EMAIL_RESET_HOURS', 3),
	
		//The minutes a lock is held on a comic, regardless of client-side timer
		ComicLockWindowMins: getIntegerEnvSettingOrDefault('COMIC_LOCK_WINDOW_MINS', 3),
		//The minutes a panel won't again be shown to a player after skipping
		PanelSkipWindowMins: getIntegerEnvSettingOrDefault('PANEL_SKIP_WINDOW_MINS', 30),
	
		//The max number of unique skips on a panel before REMOVING it
		ComicPanelSkipLimit: getIntegerEnvSettingOrDefault('COMIC_PANEL_SKIP_LIMIT', 8),
		//The max number of unique reports on a panel before CENSORING it
		ComicPanelReportLimit: getIntegerEnvSettingOrDefault('COMIC_PANEL_REPORT_LIMIT', 2),
	
		//The amount days to find censored panels for when checking max panels before ban
		ComicPanelCensorForUserWindowDays: getIntegerEnvSettingOrDefault('COMIC_PANEL_CENSOR_FOR_USER_WINDOW_DAYS', 14),	
		//The max number of censored panels before a temporary ban
		ComicPanelCensorForUserLimit: getIntegerEnvSettingOrDefault('COMIC_PANEL_CENSOR_FOR_USER_LIMIT', 2),
	
		//The chance a new comic will be started instead of an existing game (1 in X, 0 for never)
		ComicPlayNewChance: getIntegerEnvSettingOrDefault('COMIC_PLAY_NEW_CHANCE', 0),
	
		//The length of time a user is temporarily
		UserTemporarilyBannedDays: getIntegerEnvSettingOrDefault('USER_TEMPORARILY_BANNED_DAYS', 2),
		//The amount of temporary bans before a permanent one
		UserTemporarilyBannedLimit: getIntegerEnvSettingOrDefault('USER_TEMPORARILY_BANNED_LIMIT', 2)
	}
};