const error = {
	logError: (err, db = null) => {
		console.log(err);
	
		if(db) {
			db.Log.create({
				Type: '500 ERROR',
				Message: err.toString()
			});
		}
	},

	resError: (res, err, db = null) => {
		// If db param specified, the err is treated as a serious err
		// It will be logged, and the err to the client will be generic
		error.logError(err, db);

		if(res && !res.headersSent) {
			res.json({ 
				error: db 
					? 'Sorry, something went wrong. Please try again later.' 
					: err
			});
		}
	},

	resError401: (res, err, db = null) => {
		error.logError(err, db);

		if(res && !res.headersSent) {
			//401 Always sends the same error to the user
			res.status(401).send({ error: 'Authentication failed. Please log in.' });
		}
	}
};

module.exports = error;