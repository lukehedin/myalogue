const jwt = require('jsonwebtoken');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const saltRounds = 10;

const auth = {
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
	
	getJwtToken: (userId, callback) => {
		jwt.sign({
			userId
		}, process.env.JWT_SECRET_KEY, {
			expiresIn: 604800 //1 week
		}, (err, token) => {
			callback("Bearer " + token);
		});
	},

	getHexToken: (length = 64) => {
		return crypto.randomBytes(length).toString('hex');
	}
};

module.exports = auth;