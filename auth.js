const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const saltRounds = 10;

const auth = {
	hashPassword: (password, callback) => {
		bcrypt.genSalt(saltRounds, (err, salt) => {
			bcrypt.hash(password, salt, (err, hash) => callback(err, hash));
		});
	},
	
	getJwtToken: (userId, username, callback) => {
		jwt.sign({
			userId,
			username
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