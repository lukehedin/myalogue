
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import enforce from 'express-sslify';
import jwt from 'jsonwebtoken';

import routes from './routes';
import common from './common';

import Database from './Database';

import ComicService from './services/ComicService';
import EmailService from './services/EmailService';
import NotificationService from './services/NotificationService';
import PlayService from './services/PlayService';
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

	app.get('*', (req, res) => {
		res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
	});
} else {
	console.log('DEVELOPMENT');
}

let db = new Database();
db.LoadModels();

const services = {
	Comic: new ComicService(db.models, () => services),
	Email: new EmailService(db.models, () => services),
	Notification: new NotificationService(db.models, () => services),
	Play: new PlayService(db.models, () => services),
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
	const registerRoute = (route, isPublic = false) => {
		app.post(`/api/${route}`, async (req, res) => {
			let hasAuthenticationError = false;

			if(!isPublic) {
				try {
					//The userId comes from the token, so sending up another one isn't an option
					if(req.userId) {
						//Ensure the user hasn't become banned since last private request (can't become unverified or anything else).
						let dbUser = await services.User.DbGetByIdNotBanned(req.userId);
						
						if(dbUser) {
							//The user is valid.
							//Add isAdmin setting, then flow down to next try/catch
							req.isAdmin = dbUser.IsAdmin;
						} else {
							throw `UserId ${req.userId} supplied, but no valid db user found.`;
						}
					} else {
						throw `Anonymous user tried to access private route`;
					}
				} catch(error) {
					hasAuthenticationError = true;

					//Authentication error (401) Always sends the same error to the user
					db.LogError(error);
					res.status(401).send({ error: 'Authentication failed. Please log in.' });
				}
			}

			if(!hasAuthenticationError) {
				try {
					let result = await routes[isPublic ? 'public' : 'private'][route](req, services);
					res.json(result || { success: true });
				} catch (error) {
					//Only serious errors should hit this, validation/UI errors should use {error:}
					db.LogError(error);
					//There is a possibility an error occrrued on something asynchronus after res was sent
					if(res && !res.headersSent) {
						res.json(common.getErrorResult('Sorry, something went wrong. Please try again later.'));
					}
				}
			}
		});
	};

	Object.keys(routes.public).forEach(route => registerRoute(route, true));
	Object.keys(routes.private).forEach(route => registerRoute(route));
  
	const port = common.config.Port;
  
	app.listen(port, () => `Server running on port ${port}`);
}