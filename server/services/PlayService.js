import Sequelize from 'sequelize';
import validator from 'validator';
import moment from 'moment';

import common from '../common';
import mapper from '../mapper';

import Service from './Service';

export default class PlayService extends Service {
	async Play(userId, anonId, templateId, groupId, groupChallengeId) {
		//Random chance to start new comic
		let startNewComic = !!common.config.ComicPlayNewChance && common.getRandomInt(1, common.config.ComicPlayNewChance) === 1;
		let userInGroupIds = [];

		//Ensure user is in the group, if specified
		if(groupId) {
			let dbGroupUsers = await this.models.GroupUser.findAll({
				where: {
					UserId: userId
				}
			});
			userInGroupIds = dbGroupUsers.map(dbGroupUser => dbGroupUser.GroupId);

			//User is not in group, remove group params
			if(!userInGroupIds.includes(groupId)) {
				groupId = null;
				groupChallengeId = null;
			}
		} else {
			//Don't allow an challenge if groupId isn't provided
			groupId = null;
			groupChallengeId = null;
		}

		return startNewComic
			? await this.CreateNewComic(userId, anonId, templateId, groupId, groupChallengeId)
			: await this.FindRandomInProgressComic(userId, anonId, userInGroupIds, templateId, groupId, groupChallengeId);

	}
	async CreateNewComic(userId, anonId, templateId, groupId, groupChallengeId) {
		let templateWhere = {
			UnlockedAt: {
				[Sequelize.Op.ne]: null,
				[Sequelize.Op.lte]: new Date()
			}
		};
		if(templateId) templateWhere.TemplateId = templateId;

		let dbLatestTemplates = await this.models.Template.findAll({
			//If a templateId is supplied, only 1 will be returned and the random below will select it
			where: templateWhere,
			order: [[ 'UnlockedAt', 'DESC' ]]
		});

		if(!dbLatestTemplates || dbLatestTemplates.length === 0) throw 'No templates to play with';
		
		//Anonymous users can't access the latest template right away (but if there is only 1, dont skip it!)
		let startIdx = (userId || dbLatestTemplates.length === 1 ? 0 : 1);
		let dbTemplate = dbLatestTemplates[common.getRandomInt(startIdx, dbLatestTemplates.length - 1)];

		//By this point we have already made sure the user is in the group, but we must validate the challenge if provided
		if(groupId) {
			if(groupChallengeId) {
				let dbGroupChallenge = await this.models.GroupChallenge.findOne({
					where: {
						GroupId: groupId,
						GroupChallengeId: groupChallengeId
					}
				});
	
				//Challenge not found, bail out
				if(!dbGroupChallenge) groupChallengeId = null;
			} else {
				let dbGroupChallenges = await this.models.GroupChallenge.findAll({
					where: {
						GroupId: groupId
					},
					limit: 1,
					order: [Sequelize.fn('RANDOM')]
				});

				if(dbGroupChallenges.length > 0) groupChallengeId = dbGroupChallenges[0].GroupChallengeId;
			}
		}

		//Create a new comic with these properties, and have it locked right away
		let dbNewComic = await this.models.Comic.create({
			TemplateId: dbTemplate.TemplateId,
			
			PanelCount: this._GetRandomPanelCount(dbTemplate.MinPanelCount, dbTemplate.MaxPanelCount),
			IsAnonymous: !userId,

			GroupId: groupId,
			GroupChallengeId: groupChallengeId,

			//Important- without this, a user may pick up the comic before it's prepared for play
			LockedAt: new Date(),
			LockedByUserId: userId,
			LockedByAnonId: anonId
		});

		return await this.PrepareDbComicForPlay(userId, anonId, dbNewComic);
	}
	async FindRandomInProgressComic(userId, anonId, userInGroupIds, templateId, groupId, groupChallengeId) {
		let comicWhere = {
			CompletedAt: {
				[Sequelize.Op.eq]: null //Incomplete comics
			},
			LockedAt: { //That aren't in the lock window (currently being edited)
				[Sequelize.Op.or]: {
					[Sequelize.Op.lte]: this._GetComicLockWindow(),
					[Sequelize.Op.eq]: null
				}
			},
			GroupId: { // Let me stumble into my own group's comics, but not those by other groups
				[Sequelize.Op.or]: {
					[Sequelize.Op.in]: userInGroupIds,
					[Sequelize.Op.eq]: null
				}
			}
		};

		//Where I wasn't the last author
		if(userId) {
			//Only logged in users can target a template and groups
			if(templateId) comicWhere.TemplateId = templateId;
			if(groupId) comicWhere.GroupId = groupId;
			if(groupChallengeId) comicWhere.GroupChallengeId = groupChallengeId;

			comicWhere.IsAnonymous = false;
			comicWhere.LastAuthorUserId = {
				[Sequelize.Op.or]: {
					[Sequelize.Op.ne]: userId,
					[Sequelize.Op.eq]: null
				}
			};
			comicWhere.PenultimateAuthorUserId = {
				[Sequelize.Op.or]: {
					[Sequelize.Op.ne]: userId,
					[Sequelize.Op.eq]: null
				}
			};
		} else {
			comicWhere.IsAnonymous = true;
			comicWhere.LastAuthorAnonId = {
				[Sequelize.Op.or]: {
					[Sequelize.Op.ne]: anonId,
					[Sequelize.Op.eq]: null
				}
			};
		}
	
		if(userId) {
			//Don't bring back comics we've recently skipped panels for
			let dbRecentComicPanelSkips = await this.models.ComicPanelSkip.findAll({
				where: {
					UserId: userId,
					UpdatedAt: {
						[Sequelize.Op.gte]: moment(new Date()).subtract(common.config.ComicPanelSkipWindowMins, 'minutes').toDate()
					}
				},
				include: [{
					model: this.models.ComicPanel,
					as: 'ComicPanel'
				}],
				//Only take the latest 20 skips
				order: [['UpdatedAt', 'DESC']],
				limit: common.config.ComicPanelSkipWindowLimit
			});
			
			//Unique list of skipped comic ids
			let recentlySkippedComicIds = [...new Set(
				dbRecentComicPanelSkips
					.filter(dbRecentComicPanelSkip => dbRecentComicPanelSkip.ComicPanel && dbRecentComicPanelSkip.ComicPanel.ComicId)
					.map(dbRecentComicPanelSkip => dbRecentComicPanelSkip.ComicPanel.ComicId)
			)];

			//An improvement here could be to check if any panels have been made since
			//I last skipped the comic, and don't filter out those ones- but its a big job

			comicWhere.ComicId = {
				[Sequelize.Op.notIn]: recentlySkippedComicIds
			};
		}

		//Try to find a random incomplete comic
		let randomDbComics = await this.models.Comic.findAll({
			limit: 1,
			where: comicWhere,
			include: [{ //Don't return comments, ratings, etc for this one, just panels
				model: this.models.ComicPanel,
				as: 'ComicPanels'
			}, {
				model: this.models.GroupChallenge,
				as: 'GroupChallenge'
			}],
			//Might be better if this also pushed groups to the front
			order: [Sequelize.fn('RANDOM')]
		});

		if(!randomDbComics || randomDbComics.length === 0) {
			//No incomplete comics found, make a new one
			return await this.CreateNewComic(userId, anonId, templateId, groupId, groupChallengeId);
		} else {
			let dbComic = randomDbComics[0];

			//Before anything else: Lock the comic!
			//We specifically do an update that AGAIN checks the lock status, because it MIGHT have changed
			//Below, we check affectedRows and if this comic was not affected, it WAS LOCKED!
			let [affectedRows] = await this.models.Comic.update({
				LockedAt: new Date(),
				LockedByUserId: userId,
				LockedByAnonId: anonId
			}, {
				returning: true,
				where: {
					ComicId: dbComic.ComicId,
					LockedAt: {
						[Sequelize.Op.or]: {
							[Sequelize.Op.lte]: this._GetComicLockWindow(),
							[Sequelize.Op.eq]: null
						}
					}
				}
			});

			if(affectedRows !== 1) {
				//Recursion!
				console.log('Comic aquired a lock already (attempted locking by user ID:' + userId + '), finding another instead.');
				return await this.FindRandomInProgressComic(userId, anonId, userInGroupIds, templateId, groupId, groupChallengeId);
			} else {
				//We have locked the comic, prepare it for play
				return await this.PrepareDbComicForPlay(userId, anonId, dbComic);
			}
		}
	}
	async PrepareDbComicForPlay(userId, anonId, dbComic) {
		// Once a dbComic has been found or created AND IS LOCKED, this function is called to prepare it for play.
		let completedComicPanels = dbComic.ComicPanels || [];
		let currentComicPanel = completedComicPanels.length > 0
			? completedComicPanels.sort((cp1, cp2) => cp1.Ordinal - cp2.Ordinal)[completedComicPanels.length - 1]
			: null;
		let nextPanelIsFirst = !currentComicPanel;
		let nextPanelIsLast = completedComicPanels.length + 1 === dbComic.PanelCount;
		let usedTemplatePanelIds = [...new Set(completedComicPanels.map(completedComicPanel => completedComicPanel.TemplatePanelId))];

		let templatePanelWhere = {
			TemplateId: dbComic.TemplateId,
			[Sequelize.Op.or]: [{
				//Return templatepanels that can repeat
				IsNeverRepeat: false
			}, {
				//Or ones that can't repeat, but haven't been used yet
				IsNeverRepeat: true,
				TemplatePanelId: {
					[Sequelize.Op.notIn]: usedTemplatePanelIds
				}
			}]
		};
	
		//Certain panels only show up in the first or last position, or never will
		nextPanelIsFirst
			? templatePanelWhere.IsNeverFirst = false
			: templatePanelWhere.IsOnlyFirst = false;
		nextPanelIsLast
			? templatePanelWhere.IsNeverLast = false
			: templatePanelWhere.IsOnlyLast = false;

		let templatePanelPromises = [
			this.models.TemplatePanel.findAll({
				order: [[Sequelize.fn('RANDOM')]],
				where: templatePanelWhere
			})
		];
		//If we have a currentComicPanel, also fetch that so we can check if it has a PanelGroup
		if(currentComicPanel) {
			templatePanelPromises.push(
				this.models.TemplatePanel.findOne({
					where: {
						TemplatePanelId: currentComicPanel.TemplatePanelId
					}
				})
			);
		}

		//Find the possible next template panels, and the current one (may be null)
		let [dbPossibleNextTemplatePanels, dbCurrentTemplatePanel] = await Promise.all(templatePanelPromises);

		//If there are no possible next template panels, something has gone wrong or a template has a bad combo of rules
		if(!dbPossibleNextTemplatePanels || dbPossibleNextTemplatePanels.length < 1) throw 'No viable next template panels';

		//Get an array of PREFERRED template panels, but this is most often completely empty
		let dbPreferredNextTemplatePanels = [];
		if(dbCurrentTemplatePanel && dbCurrentTemplatePanel.PanelGroup) {
			switch(dbCurrentTemplatePanel.PanelGroupBehaviour) {
				case common.enums.PanelGroupBehaviour.Avoid:
					dbPreferredNextTemplatePanels = dbPossibleNextTemplatePanels.filter(dbTemplatePanel => dbTemplatePanel.PanelGroup !== dbCurrentTemplatePanel.PanelGroup);
					break;
				case common.enums.PanelGroupBehaviour.Prefer:
				default:
					dbPreferredNextTemplatePanels = dbPossibleNextTemplatePanels.filter(dbTemplatePanel => dbTemplatePanel.PanelGroup === dbCurrentTemplatePanel.PanelGroup);
					break;
			}
		}

		//If we have any PREFERRED template panels, use the first of them (the random from the query above should still be applied)
		//Otherwise, use the first POSSIBLE template panel
		let dbTemplatePanel = dbPreferredNextTemplatePanels.length > 0
			? dbPreferredNextTemplatePanels[0]
			: dbPossibleNextTemplatePanels[0];
	
		//Set the next template panel (this prevents people from submitting a panel that isn't in line with the one provided)
		dbComic.NextTemplatePanelId = dbTemplatePanel.TemplatePanelId;

		await dbComic.save();
		
		return {
			comicId: dbComic.ComicId,
			templatePanelId: dbComic.NextTemplatePanelId,

			totalPanelCount: dbComic.PanelCount,
			completedPanelCount: completedComicPanels.length,

			challenge: dbComic.GroupChallenge
				? dbComic.GroupChallenge.challenge
				: null,

			currentComicPanel: currentComicPanel 
				? mapper.fromDbComicPanel(currentComicPanel) 
				: null
		};
	}
	async SubmitComicPanel(userId, anonId, comicId, dialogue) {
		let comicWhere = {
			ComicId: comicId, //Find the comic
			CompletedAt: {
				[Sequelize.Op.eq]: null // that is incomplete
			},
			LockedAt: {
				[Sequelize.Op.gte]: this._GetComicLockWindow() //and the lock is still valid
			}
		};
		//and the lock is held by me
		if(userId) {
			comicWhere.LockedByUserId = userId;
		} else {
			comicWhere.LockedByAnonId = anonId;
		}
	
		let dbComic = await this.models.Comic.findOne({
			where: comicWhere,
			order: [[{
					model: this.models.ComicPanel, 
					as: 'ComicPanels'
				}, 'Ordinal', 'ASC']
			],
			include: [{
				model: this.models.ComicPanel,
				as: 'ComicPanels'
			}]
		});

		if(!dbComic) throw 'Invalid comic submitted.';

		let isDialogueValid = validator.isLength(dialogue, { min: 1, max: 255 });
		let isComicValid = dbComic.CompletedAt === null && dbComic.ComicPanels.length < dbComic.PanelCount;
	
		if(!isComicValid || !isDialogueValid) throw 'Invalid dialogue supplied.';
			
		let dbNewComicPanel = await this.models.ComicPanel.create({
			TemplatePanelId: dbComic.NextTemplatePanelId, //We use the server's recorded nexttemplatepanelid, not one sent from the client
			ComicId: dbComic.ComicId,
			Value: dialogue,
			Ordinal: dbComic.ComicPanels.length + 1,
			UserId: userId //Might be null if anon
		});

		//Add the newly created panel to our dbComic object for the code below, and acihevement service
		dbComic.ComicPanels.push(dbNewComicPanel);
		
		let isComicCompleted = dbComic.ComicPanels.length === dbComic.PanelCount;
				
		if(isComicCompleted) dbComic.CompletedAt = new Date();

		//Remove the lock
		dbComic.LockedAt = null;
		dbComic.LockedByUserId = null;
		dbComic.LockedByAnonId = null;
		dbComic.NextTemplatePanelId = null;

		//Record me as last author
		if(userId) {
			dbComic.PenultimateAuthorUserId = dbComic.LastAuthorUserId;
			dbComic.LastAuthorUserId = userId;
		} else {
			dbComic.LastAuthorAnonId = anonId;
		}
		
		await dbComic.save();

		if(isComicCompleted) {
			await this.services.Achievement.ProcessForComicCompleted(dbComic);

			//Notify other panel creators, but not this one.
			let notifyUserIds = dbComic.ComicPanels.map(cp => cp.UserId).filter(uId => uId !== userId);
			await this.services.Notification.SendComicCompletedNotification(notifyUserIds, dbComic.ComicId);
		}
		
		return { isComicCompleted: isComicCompleted };
	}
	async SkipComic(userId, anonId, skippedComicId) {
		let skippedComicWhere = {
			ComicId: skippedComicId
		};
	
		//Important! without this anyone can clear any lock and PRETEND to skip a whole bunch
		if(userId) {
			skippedComicWhere.LockedByUserId = userId
		} else {
			skippedComicWhere.LockedByAnonId = anonId;
		}
	
		//Remove the lock on the comic
		let [dbComicsAffected] = await this.models.Comic.update({
			LockedAt: null,
			LockedByUserId: null,
			LockedByAnonId: null,
			NextTemplatePanelId: null
		}, {
			where: skippedComicWhere
		});

		//Should never be > 1: comicId alone should assure that, but in the case of 0 affected rows....
		if(dbComicsAffected !== 1) throw `${userId || 'anon'} tried to illegally skip comic ${skippedComicId}`;
		
		//Anons can't track their skips, so leave here
		if(!userId) return;
		
		//Find the current comic panels (using server data, NOT from client)
		let dbComicPanels = await this.models.ComicPanel.findAll({
			where: {
				ComicId: skippedComicId
			},
			order: [['Ordinal', 'DESC']] //This sort is used to update last authors below
		});

		//There may be no panels (if the user skipped at the BEGIN COMIC stage)
		if(dbComicPanels && dbComicPanels.length > 1) {
			let dbCurrentComicPanel = dbComicPanels[0];

			//Record a panelskip. if this is created (not found) we need to increase skipcount
			let [dbComicPanelSkip, wasCreated] = await this.models.ComicPanelSkip.findOrCreate({
				where: {
					UserId: userId,
					ComicPanelId: dbCurrentComicPanel.ComicPanelId
				}
			});

			if(wasCreated) {
				//If this was my first skip of this comic panel, increase skipcount
				let newSkipCount = dbCurrentComicPanel.SkipCount + 1;

				//If this comic panel has reached the maximum number of skips,
				if(newSkipCount > common.config.ComicPanelSkipLimit) {
					//No need to update skip count, the archived state indicates the total count is limit + 1;

					//Remove the panel (await this before we do the next update)
					await dbCurrentComicPanel.destroy();

					//Should already be sorted by reverse ordinal from query above
					let otherDbComicPanels = dbComicPanels.filter(dbComicPanel => dbComicPanel.ComicPanelId !== dbCurrentComicPanel.ComicPanelId);

					//Update the comic's lastauthoruserid/penultimateuserid to the previous panels, if they exist. Otherwise, just nullify them.					
					this.models.Comic.update({
						LastAuthorUserId: (otherDbComicPanels && otherDbComicPanels.length > 0) ? otherDbComicPanels[0].UserId : null,
						PenultimateAuthorUserId: (otherDbComicPanels && otherDbComicPanels.length > 1) ? otherDbComicPanels[1].UserId : null
					}, {
						where: {
							ComicId: skippedComicId
						}
					});

					if(dbCurrentComicPanel.UserId) this.services.Notification.SendPanelRemovedNotification(dbCurrentComicPanel);
				} else {
					dbCurrentComicPanel.SkipCount = newSkipCount;
					dbCurrentComicPanel.save();
				}
			} else {
				//If this wasn't the first skip of the panel, set updatedat so we don't see the panel again soon
				dbComicPanelSkip.UpdatedAt = new Date();
				dbComicPanelSkip.changed('UpdatedAt', true); //This is required to manually update UpdatedAt
				dbComicPanelSkip.save();
			}
		}
	}
	_GetRandomPanelCount(minPanelCount, maxPanelCount) {
		if(minPanelCount % 2 === 1) minPanelCount = minPanelCount + 1; //No odd numbers allowed.
		if(maxPanelCount % 2 === 1) maxPanelCount = maxPanelCount + 1; //No odd numbers allowed.

		let panelCount = minPanelCount;

		//Adds additional panel pairs all the way up to the max (eg. min 2 max 10: 2, 4, 6, 8, 10)
		if(maxPanelCount > panelCount) {
			let maxAdditionalPanelPairs = ((maxPanelCount - panelCount) / 2);
			let additionalPanels = (common.getRandomInt(0, maxAdditionalPanelPairs) * 2);
			panelCount = panelCount + additionalPanels;
		}

		return panelCount;
	}
	_GetComicLockWindow() {
		//2min lock in case of slow data fetching and submitting
		return moment(new Date()).subtract(common.config.ComicLockWindowMins, 'minutes').toDate();
	}
}