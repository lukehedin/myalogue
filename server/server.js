
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import enforce from 'express-sslify';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import multerStorageCloudinary from 'multer-storage-cloudinary';
const cloudinary = require('cloudinary'); //Does not work as import

import routes from './routes';
import common from './common';

import Database from './Database';

import AchievementService from './services/AchievementService';
import ComicService from './services/ComicService';
import CronService from './services/CronService';
import EmailService from './services/EmailService';
import NotificationService from './services/NotificationService';
import PlayService from './services/PlayService';
import GroupService from './services/GroupService';
import TemplateService from './services/TemplateService';
import UserService from './services/UserService';

const app = express();
app.use(bodyParser.json());

//No imports/requires above should require the settings (process.env), as they are not set until the conditional below.

if(process.env.NODE_ENV === 'production') {
	console.log('PRODUCTION'); 

	// Use trustProtoHeader because we are behind Heroku (a load balancer)
	app.use(enforce.HTTPS({ trustProtoHeader: true }));

	//Serve static assets if in prod
	app.use(express.static('client/build'));

	//This is very important, ensures scrapers and link previews, and LINKS sent to people actually returns the right root file.
	//The route in the link eg. /about will still be applied with react router, but without this get wildcard, many of those sublinks will return nothing and report NOT FOUND
	app.get('*', (req, res) => {
		res.sendFile(path.resolve(__dirname, '..', 'client', 'build', 'index.html'));
	});
} else {
	console.log('DEVELOPMENT');
}


let db = new Database();
db.LoadModels();

const services = {
	Achievement: new AchievementService(db.models, () => services),
	Comic: new ComicService(db.models, () => services),
	Cron: new CronService(db.models, () => services),
	Email: new EmailService(db.models, () => services),
	Notification: new NotificationService(db.models, () => services),
	Play: new PlayService(db.models, () => services),
	Group: new GroupService(db.models, () => services),
	Template: new TemplateService(db.models, () => services),
	User: new UserService(db.models, () => services)
};

if(common.config.IsDevelopmentScript) {
	//Development Script
  	console.log('DEV SCRIPT WILL BEGIN IN 10 SECONDS');
	setTimeout(() => {
		console.log('RUNNING DEV SCRIPT');
		db.SyncSchema(); //async
	}, 10000);
} else {
	//Not a dev script, register background cronjobs
	services.Cron.RegisterJobs();

	app.use((req, res, next) => {
		let token = req.headers['x-access-token'] || req.headers['authorization'];
		token = token ? token.slice(7, token.length).trimLeft() : null;

		if(token) {
			jwt.verify(token, common.config.JwtSecretKey, (err, decodedToken) => {
				if(decodedToken) {
					req.userId = decodedToken.userId;
					req.anonId = decodedToken.anonId;
				}
				next();
			});
		} else {
			next();
		}
	});

	//Register routes
	const getRouteAuth = (includeGroups = false) => async (req, res, next) => {
		try {
			//The userId comes from the token, so sending up another one isn't an option
			if(req.userId) {
				//Ensure the user hasn't become banned since last user request (can't become unverified or anything else).
				let dbUser = await services.User.DbGetByIdNotBanned(req.userId);
				
				if(dbUser) {
					//The user is valid, Add isAdmin setting, then move along
					req.isAdmin = dbUser.IsAdmin;

					if(includeGroups) {
						let groupUsers = await services.Group.GetGroupUsersForUserId(req.userId);

						//Attach group user info to request
						req.memberOfGroupIds = groupUsers.map(gu => gu.groupId);
						req.adminOfGroupIds = groupUsers.filter(gu => gu.isGroupAdmin).map(gu => gu.groupId);
					}

					next();
				} else {
					throw `UserId ${req.userId} supplied, but no valid db user found.`;
				}
			} else {
				throw `Anonymous user tried to access user route`;
			}
		} catch(error) {
			//Authentication error (401) Always sends the same error to the user
			db.LogError(error);
			res.status(401).send({ error: 'Authentication failed. Please login.' });
		}
	};
	const getRouteUpload = (route) => async (req, res, next) => {
		let upload = null;
		
		switch(route) {
			case `uploadUserAvatar`:
			case `uploadGroupAvatar`:
				upload = multer({ 
					limits: { fileSize: 20000000 }, //20mb
					storage: multerStorageCloudinary({
						cloudinary: cloudinary,
						params: function(req, file, cb) {
							cb(undefined, {
								folder: 'Uploads',
								allowedFormats: ['jpg', 'png'],
								transformation: ['avatar'], //make 256x256 jpg
								tags: [`userId_${req.userId}`, `env_${process.env.NODE_ENV}`]
							});
						}
					})
				})
				.single('image');
			default:
				//No upload
		}

		if(upload) {
			upload(req, res, (error) => {
				if (error) {
					db.LogError(error);
					res.json(common.getErrorResult(error.message || 'Upload failed. Please try again.'));
				} else {
					next();
				}
			})
		} else {
			next();
		}
	};
	const getRoute = (route, type) => async (req, res, next) => {
		try {
			let result = await routes[type][route](req, services);
			res.json(result);
		} catch (error) {
			//Only serious errors should hit this, validation/UI errors should use {error:}
			db.LogError(error);
			//There is a possibility an error occrrued on something asynchronus after res was sent
			if(res && !res.headersSent) {
				res.json(common.getErrorResult('Sorry, something went wrong. Please try again later.'));
			}
		}
	};

	//Public routes, accessible by anonymous and authenticated users, no additional checks before route
	Object.keys(routes.public).forEach(route => app.post(`/api/${route}`, getRoute(route, 'public')));

	//User routes, checks userId in token
	Object.keys(routes.user).forEach(route => app.post(`/api/${route}`, getRouteAuth(), getRouteUpload(route), getRoute(route, 'user')));

	//Group routes, checks userId in token and adds group permissions from DB
	Object.keys(routes.group).forEach(route => app.post(`/api/${route}`, getRouteAuth(true), getRouteUpload(route), getRoute(route, 'group')));

	const port = common.config.Port;
  
	app.listen(port, () => `Server running on port ${port}`);
}