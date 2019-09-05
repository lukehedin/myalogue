const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());

if(process.env.NODE_ENV === 'production') {
	//PRODUCTION ENV

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

		db.sync({ force: true });

	}, 10000);
} else {
	app.post('/api/customers', (req, res) => {
		db.User.findAll()
			.then(dbUsers => {
				res.json(dbUsers.map(dbUser => {
					return {
						userId: dbUser.UserId,
						email: dbUser.Email,
						username: dbUser.UserName
					}
				}));
			})
			.catch(err => {});
	});
  
	const port = process.env.PORT || 5000;
  
	app.listen(port, () => `Server running on port ${port}`);
}