const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const enforce = require('express-sslify');
const jwt = require('jsonwebtoken');
const moment = require('moment');

const error = require('./error');

const app = express();
app.use(bodyParser.json());

//No imports/requires above should require the settings (process.env), as they are not set until the conditional below.

if(process.env.NODE_ENV === 'production') {
	//PRODUCTION ENV
	// Use trustProtoHeader because we are behind Heroku (a load balancer)
	app.use(enforce.HTTPS({ trustProtoHeader: true }));

	//Serve static assets if in prod
	app.use(express.static('client/build'));

	app.get('*', (req, res) => {
		res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
	});
} else {
	//DEVELOPMENT ENV
	require('dotenv').config();
}

const settings = require('./settings'); //Must happen before the above
const db = require('./db');

if(settings.IsDevelopmentScript) {
	//Development Script
  	console.log('DEV SCRIPT WILL BEGIN IN 10 SECONDS');
	setTimeout(() => {
		console.log('RUNNING DEV SCRIPT');
		db.sync();
	}, 10000);
} else {
	app.use((req, res, next) => {
		let token = req.headers['x-access-token'] || req.headers['authorization'];
		token = token ? token.slice(7, token.length).trimLeft() : null;

		if(token) {
			jwt.verify(token, settings.JwtSecretKey, (err, decodedToken) => {
				if(decodedToken) {
					req.userId = decodedToken.userId;
					req.anonId = decodedToken.anonId;
				}
				next();
			});
		} else {
			next();
		}
	})

	//Register routes
	const routes = require('./routes.js');

	Object.keys(routes.public).forEach(route => {
		app.post(`/api/${route}`, (req, res) => {
			routes.public[route](req, res, db);
		});
	});

	Object.keys(routes.private).forEach(route => {
		app.post(`/api/${route}`, (req, res) => {
			//The userId comes from the token, so sending up another one isn't an option
			if(req.userId) {
				//Ensure the user hasn't become banned since last private request (can't become unverified or anything else).
				db.User.findOne({
					where: {
						UserId: req.userId,
						PermanentlyBannedAt: {
							[db.op.eq]: null
						},
						TemporarilyBannedAt: {
							[db.op.or]: {
								[db.op.lte]: moment().subtract(settings.UserTemporarilyBannedDays, 'days').toDate(),
								[db.op.eq]: null
							}
						}
					}
				})
				.then(dbUser => {
					if(dbUser) {
						req.isAdmin = dbUser.IsAdmin; //Add isAdmin setting
						routes.private[route](req, res, db)
					} else {
						error.resError401(res, `UserId ${req.userId} supplied, but no valid db user found.`, db);
					}
				})
				.catch(err => error.resError(res, err, db));
			} else {
				error.resError401(res, `Anonymous user tried to access private route`, db);
			}
		});
	});
  
	const port = settings.Port;
  
	app.listen(port, () => `Server running on port ${port}`);
}