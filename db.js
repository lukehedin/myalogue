const Sequelize = require('sequelize');

//Heroku requires pg ssl, and will complain if this isn't set
const pg = require('pg');
pg.defaults.ssl = true;

// I think some of these configs might be excessive, but trying to be safe
const sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false,
	ssl: true,
    dialect: 'postgres',
	protocol: 'postgres',
    dialectOptions: {
		ssl: true
	},
	pool: {
		max: 20,
		min: 0,
		idle: 10000
	}
});

const defineTable = (name, attributes, isParanoid = false) => {
	let options = isParanoid
		? {
			deletedAt: 'DeletedAt',
			paranoid: true
		}
		: {};
	
	return sequelize.define(name, {
		[`${name}Id`]: { //Primary key
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		...attributes
	}, {
		createdAt: 'CreatedAt',
		updatedAt: 'UpdatedAt',
		...options
	});
};

const getBoooleanNotNull = () => {
	return {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	};
};

let db = {
	
	fn: Sequelize.fn,
	op: Sequelize.Op,

	col: sequelize.col,

	sync: () => {
		sequelize.sync({
			//force: true
			alter: true
		})
		.then(() => {
			console.log('Database sync completed')
		});
	},
	
	//Tables

	Log: defineTable('Log', {
		Type: Sequelize.STRING,
		Message: Sequelize.TEXT
	}),

	User: defineTable('User', {
		Email: Sequelize.STRING,
		Username: Sequelize.STRING,
		Password: Sequelize.STRING,
		VerificationToken: Sequelize.STRING,
		VerificationTokenSetAt: Sequelize.DATE,
		PasswordResetToken: Sequelize.STRING,
		PasswordResetAt: Sequelize.DATE,
		LastLoginAt: Sequelize.DATE,
		IsAdmin: getBoooleanNotNull()
	}, true),
	
	Notification: defineTable('Notification', {
		Type: Sequelize.INTEGER,
		Message: Sequelize.TEXT
	}),

	UserNotification: defineTable('UserNotification', {

	}),

	Template: defineTable('Template', {
		Description: Sequelize.TEXT,
		UnlockedAt: Sequelize.DATE
	}, true),

	TemplatePanel: defineTable('TemplatePanel', {
		SizeX: Sequelize.INTEGER,
		SizeY: Sequelize.INTEGER,
		PositionX: Sequelize.INTEGER,
		PositionY: Sequelize.INTEGER,
		Image: Sequelize.STRING,
		Ordinal: Sequelize.INTEGER, //optional

		// Each comic can have 4 or 8 panels. These quarters (1-4) are scaled by that factor
		// Eg. a comic with 8 panels turns QuarterMax: 1 -> 2, 2 -> 4, 3 -> 6, 4 -> 8
		// QuarterMin: Sequelize.INTEGER, // 3 = only appears in first three panels
		// QuarterMax: Sequelize.INTEGER // 2 = only appears in last two panels
	}),
	
	Comic: defineTable('Comic', {
		CompletedAt: Sequelize.DATE,
		LockedAt: Sequelize.DATE, // locked while editing (1 min)
		Token: Sequelize.STRING, //If present, the comic is private
		PanelCount: Sequelize.INTEGER,
		Rating: {
			type: Sequelize.INTEGER,
			defaultValue: 0,
            allowNull: false
		},
		
		//Used for display
		Title: Sequelize.STRING //First line of dialogue?
	}, true),
	
	ComicPanel: defineTable('ComicPanel', {
		Ordinal: Sequelize.INTEGER,
		Value: Sequelize.STRING,
		Type: Sequelize.INTEGER, // Enum, eg. 1 'regular', 2 'whisper', 3 'yelling'
		ComicCompletedAt: Sequelize.DATE //For queryability
	}),

	ComicVote: defineTable('ComicVote', {
		Value: Sequelize.INTEGER
	}),

	ComicComment: defineTable('ComicComment', {
		Value: Sequelize.TEXT
	}, true),
};

// Associations

let createOneToMany = (belongsToTableName, hasManyTableName, belongsToAlias, hasManyAlias) => {
	if(!hasManyAlias) hasManyAlias = `${hasManyTableName}s`
	if(!belongsToAlias) belongsToAlias = `${belongsToTableName}`;

	let fk = `${belongsToAlias}Id`;

	db[belongsToTableName].hasMany(db[hasManyTableName], { as: hasManyAlias, foreignKey: fk });
	db[hasManyTableName].belongsTo(db[belongsToTableName], { as: belongsToAlias, foreignKey: fk });
};

createOneToMany('Comic', 'ComicPanel');
createOneToMany('Comic', 'ComicVote');
createOneToMany('Comic', 'ComicComment');

createOneToMany('Template', 'TemplatePanel');
createOneToMany('Template', 'Comic');

createOneToMany('TemplatePanel', 'ComicPanel');
createOneToMany('TemplatePanel', 'Comic', 'NextTemplatePanel');

createOneToMany('User', 'Comic', 'LastAuthorUser', 'LastAuthoredComics');
createOneToMany('User', 'Comic', 'LockedByUser', 'LockedComics');
createOneToMany('User', 'ComicVote');
createOneToMany('User', 'ComicComment');
createOneToMany('User', 'Notification');
createOneToMany('User', 'ComicPanel');

module.exports = db;