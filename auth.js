const jwt = require('jsonwebtoken');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const saltRounds = 10;

const settings = require('./settings');
const mapper = require('./mapper');

const auth = {
	_getJwtToken: (tokenContent, callback) => {
		jwt.sign(tokenContent, settings.JwtSecretKey, {
			expiresIn: 604800 //1 week
		}, (err, token) => {
			callback("Bearer " + token);
		});
	},
	
	hashPassword: (password, callback) => {
		let isValidPassword = validator.isLength(password, {min:8, max: 127});

		if(!isValidPassword) {
			callback('Invalid password.');
		} else {
			bcrypt.genSalt(saltRounds, (error, salt) => {
				bcrypt.hash(password, salt, (error, hash) => callback(error, hash));
			});
		}
	},
	
	getUserJwtResult: (dbUser, callback) => {
		auth._getJwtToken({ userId: dbUser.UserId }, (token) => {
			//The object sent to a successfully authenticated user
			let result = {
				...mapper.fromDbUser(dbUser), //userid, username, avatar etc
				token
			}
	
			callback(result);
		});
	},

	getAnonJwtResult: (anonId, callback) => {
		auth._getJwtToken({ anonId: anonId }, (token) => {
			//The object sent to a successfully authenticated user
			let result = {
				token
			};
	
			callback(result);
		});
	},

	getHexToken: (length = 64) => {
		return crypto.randomBytes(length).toString('hex');
	}
};

module.exports = auth;