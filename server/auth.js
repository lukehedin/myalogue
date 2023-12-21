import jwt from 'jsonwebtoken';
import validator from 'validator';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

import common from './common';

const auth = {
	//NOAUTH: disable all auth

	// hashPassword: (password) => {
	// 	//Not async, but promise
	// 	return new Promise((resolve, reject) => {
	// 		let isValidPassword = validator.isLength(password, {min:8, max: 127});
	// 		if(!isValidPassword) reject('Invalid password.');
			
	// 		bcrypt.genSalt(common.config.SaltRounds, async (error, salt) => {
	// 			if(error) reject(error);

	// 			bcrypt.hash(password, salt, (error, hash) => {
	// 				if(error || !hash) reject(error);
	// 				resolve(hash);
	// 			});
	// 		});
	// 	});
	// },
	// getUserJwtResult: async (user) => {
	// 	let token = await auth._getJwtToken({ userId: user.userId });
	// 	//The authResult sent to a successfully authenticated user
	// 	return {
	// 		user,
	// 		token
	// 	};
	// },
	getAnonJwtResult: async (anonId) => {
		let token = await auth._getJwtToken({ anonId: anonId });
		//The authResult sent to an anonymous user

		return { 
			token
		};
	},
	// comparePassword: async (password, hashedPassword) => {
	// 	if(!password || !hashedPassword) throw 'Password compare: empty password';
	// 	return await bcrypt.compare(password, hashedPassword);
	// },
	_getJwtToken: (tokenContent) => {
		//Not async, but promise
		return new Promise((resolve, reject) => {
			jwt.sign(tokenContent, common.config.JwtSecretKey, {
				expiresIn: 604800 //1 week
			}, (error, token) => {
				if(error || !token) reject(error || 'Token sign failed');
				resolve("Bearer " + token);
			});
		});
	},
	getHexToken: (length = 64) => {
		return crypto.randomBytes(length).toString('hex');
	}
};

export default auth;