const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const enforce = require('express-sslify');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

if(process.env.NODE_ENV === 'production') {
	//PRODUCTION ENV

	// Use enforce.HTTPS({ trustProtoHeader: true }) because we are behind Heroku (a load balancer)
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

const db = require('./db');

if(process.env.IS_DEVELOPMENT_SCRIPT === "true") {
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
			jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
				if(decodedToken) {
					req.userId = decodedToken.userId;
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
			if(req.userId) {
				//The userId comes from the token, so sending up another one isn't an option
				routes.private[route](req, res, db);
			} else {
				res.status(500).send({ error: 'Authentication failed. Please log in.' });
			}
		});
	});
  
	const port = process.env.PORT || 5000;
  
	app.listen(port, () => `Server running on port ${port}`);
}