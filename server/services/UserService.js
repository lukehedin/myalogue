import Sequelize from 'sequelize';
import validator from 'validator';
import moment from 'moment';
import common from '../common';
import mapper from '../mapper';
import auth from '../auth';

import Service from './Service';

export default class UserService extends Service {
	async DbGetById(userId, additionalWhere = {}) {
		//This returns the whole dbUser and should not be used if returning to the client
		//Sensitive data will go with it!
		return await this.models.User.findOne({
			where: {
				...additionalWhere,
				UserId: userId,
				VerificationToken: {
					[Sequelize.Op.eq]: null //unverified users cant do anything
				}
			}
		});
	}
	async DbGetByUsernames(usernames, additionalWhere = {}) {
		let cleanUsernames = usernames.map(username => username.trim().toLowerCase());

		return await this.models.User.findAll({
			where: [
				Sequelize.where(Sequelize.fn('lower', Sequelize.col('Username')), {
					[Sequelize.Op.in]: cleanUsernames
				}), {
				...additionalWhere,
				VerificationToken: {
					[Sequelize.Op.eq]: null //unverified users cant do anything
				}
			}]
		});
	}
	async DbGetByUsername(username, additionalWhere = {}) {
		let dbUsers = await this.DbGetByUsernames([username], additionalWhere);
		if(dbUsers && dbUsers.length > 0) return dbUsers[0];
	}
	async DbGetByUsernameEmailMatch(email, username, additionalWhere = {}) {
		//Includes banned and unverified users

		//Username can't have @ or . in it, while email MUST.
		//Thus, there can be no crossover.

		//This should already be done, but just to be sure
		let cleanEmail = email.trim().toLowerCase();
		let cleanUsername = username.trim().toLowerCase();
		
		let existingDbUser = await this.models.User.findOne({
			where: {
				...additionalWhere,
				[Sequelize.Op.or]: [
					Sequelize.where(Sequelize.fn('lower', Sequelize.col('Email')), cleanEmail),
					Sequelize.where(Sequelize.fn('lower', Sequelize.col('Username')), cleanUsername)
				]
			}
		});

		return existingDbUser;
	}
	async DbGetByIdNotBanned(userId) {
		return await this.DbGetById(userId, this._GetUserNotBannedWhere())
	}
	async GetById(userId) {
		//Does not include unverified
		let dbUser = await this.DbGetById(userId);
		return dbUser ? mapper.fromDbUser(dbUser) : null;
	}
	async GetByUsername(username) {
		//Does not include unverified
		let dbUser = await this.DbGetByUsername(username);
		return dbUser ? mapper.fromDbUser(dbUser) : null;
	}
	async Authenticate(userId, anonId) {
		if(userId) {
			let dbUser = await this.DbGetByIdNotBanned(userId);
			if(!dbUser) throw(`Invalid userId ${dbUser} in token`);

			//Record the lastloginat - no need to await
			dbUser.LastLoginAt = new Date();
			dbUser.save();

			//Refresh the token after a successful authenticate
			return await auth.getUserJwtResult(mapper.fromDbUser(dbUser));
		} else {
			//Refresh existing anonId if one supplied, otherwise generate new
			if(!anonId) anonId = auth.getHexToken();
			
			return await auth.getAnonJwtResult(anonId);
		}
	}
	async Login (emailUsername, password) {
		//We want to include banned users, so we can do a proper error message below
		let dbUser = await this.DbGetByUsernameEmailMatch(emailUsername, emailUsername);

		if(!dbUser) return common.getErrorResult('Invalid email/username or password.');

		const banMistakeMessage = `If you believe this ban was a mistake, contact admin@s4ycomic.com and provide your username.`;

		if(dbUser.VerificationToken) {
			//If the user still has an uncleard verification token
			if(dbUser.VerificationTokenSetAt < moment().subtract(common.config.AccountEmailResetHours, 'hours').toDate()) {
				//If the user is trying to access an account they setup but never verified, and it has been past the reset hours buffer, send the verification email again
				await this.PrepareForVerifyAccount(dbUser);
				return common.getErrorResult('Please verify your email address. A new verification email has been sent.');
			} else {
				return common.getErrorResult('Please verify your email address.');
			}
		} else if (dbUser.PermanentlyBannedAt) {
			return common.getErrorResult(`Your account has been permanently banned. ${banMistakeMessage}`);
		} else if (dbUser.TemporarilyBannedAt && dbUser.TemporarilyBannedAt > moment().subtract(common.config.UserTemporarilyBannedDays, 'days').toDate()) {
			return common.getErrorResult(`Your account has been temporarily banned (${moment(dbUser.TemporarilyBannedAt).add(common.config.UserTemporarilyBannedDays, 'days').fromNow(true) + ' remaining'}). ${banMistakeMessage}`);
		} else {
			let isPasswordMatch = await auth.comparePassword(password, dbUser.Password);
			if(!common.config.IsDev && !isPasswordMatch) return common.getErrorResult('Invalid email/username or password.');

			return await auth.getUserJwtResult(mapper.fromDbUser(dbUser));
		}
	}
	async Register (email, username, password) {
		email = email.trim().toLowerCase();
		username = username.trim().toLowerCase();

		let isValidEmail = validator.isEmail(email);
		let isValidUsername = validator.isLength(username, {min: 3, max: 20 }) 
			&& validator.isAlphanumeric(username) 
			&& !common.config.ForbiddenUserNames.includes(username)
			&& isNaN(username); //Can't have a username with just numbers, confuses profile page

		if(!isValidEmail || !isValidUsername) throw 'Invalid email/username or username supplied.';

		//Check for existing username or email match
		let dbExistingUser = await this.DbGetByUsernameEmailMatch(email, username);
		
		if(dbExistingUser) {
			return { 
				error: dbExistingUser.Email === email
					? 'Email is already in use. Please log in with your existing account or reset your password.'
					: 'Username is already in use. Please choose another username.'
			};
		}

		//Check for disposable email
		let isAcceptable  = await this.services.Email.IsEmailAddressAcceptable(email);
		if(!isAcceptable) return common.getErrorResult('Disposable emails are not allowed. Please enter another email address.');

		//Checks if password valid too
		let hashedPassword = await auth.hashPassword(password);

		let dbUser = await this.models.User.create({
			Email: email,
			Username: username,
			Password: hashedPassword
		});
		
		await this.PrepareForVerifyAccount(dbUser);
	}
	async VerifyAccount (token) {
		let dbUser = await this.models.User.findOne({
			where: {
				VerificationToken: token
			}
		});
		
		if(!dbUser) return common.getErrorResult('Account verification failed.');

		dbUser.VerificationToken = null;
		
		await dbUser.save();

		this.services.Notification.SendWelcomeNotification(dbUser.UserId);

		return await auth.getUserJwtResult(mapper.fromDbUser(dbUser))
	}
	async ForgotPassword (emailUsername) {
		let now = new Date();

		let dbUser = await this.DbGetByUsernameEmailMatch(emailUsername, emailUsername, {
			...this._GetUserNotBannedWhere(),
			 //Don't let someone request a password if they unverified, or a request is already in progress
			VerificationToken: {
				[Sequelize.Op.eq]: null
			},
			PasswordResetAt: {
				[Sequelize.Op.or]: {
					[Sequelize.Op.lte]: moment().subtract(common.config.AccountEmailResetHours, 'hours').toDate(),
					[Sequelize.Op.eq]: null
				}
			}
		});

		//Don't error on invalid email or username
		//Always say the same thing, even if it didn't work
		if(dbUser) {
			let passwordResetToken = auth.getHexToken();
			dbUser.PasswordResetToken = passwordResetToken;
			dbUser.PasswordResetAt = now;
			dbUser.save();

			this.services.Email.SendForgotPasswordEmail(dbUser.Email, dbUser.Username, passwordResetToken);
		} else {
			// this.services.Email.SendForgotPasswordNoAccountEmail(dbUser.Email);
		}

		return;
	}
	async SetPassword (token, password) {
		if(!token) return common.getErrorResult('This password reset request is invalid or has expired.');

		let dbUser = await this.models.User.findOne({
			where: {
				...this._GetUserNotBannedWhere(),
				PasswordResetAt: {
					[Sequelize.Op.lte]: moment().add(common.config.AccountEmailResetHours, 'hours').toDate()
				},
				PasswordResetToken: token
			}
		});
		
		if(!dbUser) return common.getErrorResult('This password reset request is invalid or has expired.');

		let hashedPassword = await auth.hashPassword(password);
		dbUser.Password = hashedPassword;
		dbUser.PasswordResetAt = null;
		dbUser.PasswordResetToken = null;

		//Wait for this save in case it fails
		await dbUser.save();

		return await auth.getUserJwtResult(mapper.fromDbUser(dbUser));
	}
	async ChangePassword (userId, currentPassword, newPasword) {
		//Should only be done by an already logged in user
		let dbUser = await this.DbGetByIdNotBanned(userId);

		if(!dbUser) throw 'User not found.';

		let isPasswordMatch = await auth.comparePassword(currentPassword, dbUser.Password);
		if(!isPasswordMatch) return common.getErrorResult('Your current password was incorrect.');

		//Update new password
		let hashedPassword = await auth.hashPassword(newPasword);
		dbUser.Password = hashedPassword;
		
		//Wait for this save in case it fails
		await dbUser.save();

		return;
	}
	async Ban(userId) {
		let dbUser = await this.DbGetByIdNotBanned(userId);

		//(!dbUser === they may be already banned) also dont ban admins
		if(dbUser && !dbUser.IsAdmin) {
			let newBanCount = dbUser.TemporarilyBannedCount + 1;
			if(newBanCount > common.config.UserTemporarilyBannedLimit) {
				//If they've exceeded the last time they can get a temp ban, perm ban instead
				dbUser.PermanentlyBannedAt = new Date();
				dbUser.BannedReason = (dbUser.BannedReason ? ' | ' : '') + 'Too many censored panels, too many temporary bans';
				this.models.Log.create({
					Type: 'PERMANENT BAN',
					Message: `UserId ${dbUser.UserId} was banned permanently`
				});
			} else {
				//If they can still get a temp ban, do that
				dbUser.TemporarilyBannedAt = new Date();
				dbUser.TemporarilyBannedCount = newBanCount;
				dbUser.BannedReason = (dbUser.BannedReason ? ' | ' : '') + 'Too many censored panels';
				this.models.Log.create({
					Type: 'TEMPORARY BAN',
					Message: `UserId ${dbUser.UserId} was banned temporarily (${newBanCount} so far)`
				});
			}

			await dbUser.save();
		}
		
		return;
	}
	async SaveAvatar (userId, avatar) {
		//If someone sends up bad values for these it doesn't do anything breaky
		return await this.models.User.update({
			AvatarExpression: avatar.expression,
			AvatarCharacter: avatar.character,
			AvatarColour: avatar.colour
		}, {
			where: {
				UserId: userId
			}
		});
	}
	async PrepareForVerifyAccount(dbUser) {
		let verificationToken = auth.getHexToken();

		this.models.User.update({
			VerificationToken: verificationToken,
			VerificationTokenSetAt: new Date()
		}, {
			where: {
				UserId: dbUser.UserId
			}
		});

		this.services.Email.SendVerificationEmail(dbUser.Email, dbUser.Username, verificationToken);
	}
	async GetUserAchievementInfo(userId, userStats) {
		let dbUserAchievements = await this.models.UserAchievement.findAll({
			where: {
				UserId: userId
			}
		});

		return {
			userAchievements: dbUserAchievements.map(mapper.fromDbUserAchievement),
			userAchievementProgress: userStats 
				? {
					[common.enums.AchievementType.LotsOfTemplates]: Object.keys(userStats.templateUsageLookup).length,
					[common.enums.AchievementType.LotsOfLastPanels]: userStats.lastPanelCount,
					[common.enums.AchievementType.LotsOfFirstPanels]: userStats.firstPanelCount,
					[common.enums.AchievementType.LotsOfComics]: userStats.comicCount,
					[common.enums.AchievementType.HighTotalRating]: userStats.comicTotalRating,
					[common.enums.AchievementType.LotsOfRatings]: userStats.ratingCount,
					[common.enums.AchievementType.LotsOfRatingsForOthers]: userStats.ratingCountForOthers
				} 
				: {}
		};
	}
	async GetStatsForUser(userId) {
		//Does an vast find of all the user's comicpanels and subsequent comics, then creates their stats
		//Is used for profile, but also for worker jobs to calculate leaderboards and achievements
		let dbComicPanels = await this.services.Comic.GetComicPanelsForUserNotCensored(userId);

		let comicIds = dbComicPanels.map(dbComicPanel => dbComicPanel.ComicId);

		let dbComics = await this.models.Comic.findAll({
			where: {
				ComicId: {
					[Sequelize.Op.in]: comicIds
				},
				CompletedAt: {
					[Sequelize.Op.ne]: null
				}
			},
			order: [[ 'Rating', 'DESC' ], ['CompletedAt', 'DESC']]
		});

		let dbComicVotes = await this.models.ComicVote.findAll({
			where: {
				UserId: userId,
				Value: {
					[Sequelize.Op.ne]: 0
				}
			}
		});
		
		let completedComicIds = dbComics.map(dbComic => dbComic.ComicId);
		let comicTotalRating = dbComics.reduce((total, dbComic) => total + (dbComic.Rating > 0 ? dbComic.Rating : 0), 0);
		let comicAverageRating = comicTotalRating / dbComics.length;
		
		let templateUsageLookup = dbComics.reduce((lookup, dbComic) => {
			lookup[dbComic.TemplateId] = lookup[dbComic.TemplateId]
				? lookup[dbComic.TemplateId] + 1
				: 1;

			return lookup;
		}, {});
		let firstPanelCount = 0;
		let lastPanelCount = 0;

		dbComics.forEach(dbComic => {
			let dbComicPanelsByUser = dbComicPanels.filter(dbComicPanel => dbComicPanel.ComicId === dbComic.ComicId && dbComicPanel.UserId === userId);
			if(dbComicPanelsByUser.find(dbComicPanelByUser => dbComicPanelByUser.Ordinal === 1)) firstPanelCount++;
			if(dbComicPanelsByUser.find(dbComicPanelByUser => dbComicPanelByUser.Ordinal === dbComic.PanelCount)) lastPanelCount++;
		});
		
		return {
			panelCount: dbComicPanels.filter(dbComicPanel => completedComicIds.includes(dbComicPanel.ComicId)).length,
			comicCount: dbComics.length,
			comicTotalRating: comicTotalRating,
			comicAverageRating: comicAverageRating,

			templateUsageLookup: templateUsageLookup,
			firstPanelCount,
			lastPanelCount,

			ratingCount: dbComicVotes.length,
			ratingCountForOthers: dbComicVotes.filter(dbComicVote => !comicIds.includes(dbComicVote.ComicId)).length
		};
	}
	_GetUserNotBannedWhere() {
		return {
			PermanentlyBannedAt: {
				[Sequelize.Op.eq]: null
			},
			TemporarilyBannedAt: {
				[Sequelize.Op.or]: {
					[Sequelize.Op.lte]: moment().subtract(common.config.UserTemporarilyBannedDays, 'days').toDate(),
					[Sequelize.Op.eq]: null
				}
			}
		};
	}
}