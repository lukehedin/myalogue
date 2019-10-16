const Sequelize = require('sequelize');

const common = require('./common');

//Heroku requires pg ssl, and will complain if this isn't set
const pg = require('pg');
pg.defaults.ssl = true;

// I think some of these configs might be excessive, but trying to be safe
const sequelize = new Sequelize(common.config.DatabaseUrl, {
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

const defineTable = (name, attributes = {}, isParanoid = false) => {
	let options = isParanoid
		? {
			deletedAt: 'ArchivedAt',
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
const getIntegerNotNull = (defaultValue = 0) => {
	return {
		type: Sequelize.INTEGER,
		defaultValue: defaultValue,
		allowNull: false
	}
};

let db = {
	
	//Could be importing these but want to avoid using without db
	fn: Sequelize.fn,
	op: Sequelize.Op,
	col: Sequelize.col,
	where: Sequelize.where,

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
		IsAdmin: getBoooleanNotNull(),
		AvatarCharacter: Sequelize.INTEGER,
		AvatarExpression: Sequelize.INTEGER,
		AvatarColour: Sequelize.INTEGER,
		TemporarilyBannedAt: Sequelize.DATE,
		TemporarilyBannedCount: getIntegerNotNull(),
		PermanentlyBannedAt: Sequelize.DATE,
		BannedReason: Sequelize.STRING
	}, true),
	
	Notification: defineTable('Notification', {
		Type: getIntegerNotNull(1),
		Title: Sequelize.STRING,
		Message: Sequelize.TEXT,
		IsWelcomeNotification: getBoooleanNotNull() //SCHEMA-TODO REMOVE
	}),

	UserNotification: defineTable('UserNotification', {
		SeenAt: Sequelize.DATE,
		ActionedAt: Sequelize.DATE,
		RenewedAt: Sequelize.DATE, //When unseen notifications get updated, this does too. If present, used to override CreatedAt and bump notifications back to top.
		ValueInteger: Sequelize.INTEGER, //A value that can be used for incrementing purposes (eg. "and 34 others") - not to be used as a FK!
		ValueString: Sequelize.TEXT //A value that can be used for description purposes (eg. your text was "i hate eggs")
	}),

	Template: defineTable('Template', {
		UnlockedAt: Sequelize.DATE,
		Name: Sequelize.STRING,
		Ordinal: Sequelize.INTEGER,
		MaxPanelCount: getIntegerNotNull(8),
		// DescriptionHtml: Sequelize.TEXT
	}, true),

	TemplatePanel: defineTable('TemplatePanel', {
		SizeX: Sequelize.INTEGER,
		SizeY: Sequelize.INTEGER,
		PositionX: Sequelize.INTEGER,
		PositionY: Sequelize.INTEGER,
		Image: Sequelize.STRING,
		TextAlignVertical: Sequelize.INTEGER, //null = bottom 1.bottom, 2.top, 3.middle
		TextAlignHorizontal: Sequelize.INTEGER, //null = middle 1.middle, 2.left, 3.right
		TextColour: Sequelize.INTEGER, //null = black, 1. white
		Ordinal: Sequelize.INTEGER, //optional
		Description: Sequelize.TEXT,
		IsOnlyLast: getBoooleanNotNull(),
		IsOnlyFirst: getBoooleanNotNull(),
		IsNeverLast: getBoooleanNotNull(),
		IsNeverFirst: getBoooleanNotNull()
	}, true),
	
	Comic: defineTable('Comic', {
		CompletedAt: Sequelize.DATE,
		Token: Sequelize.STRING, //If present, the comic is private
		PanelCount: Sequelize.INTEGER,
		Rating: getIntegerNotNull(),
		LockedAt: Sequelize.DATE, // locked while editing (1 min)

		//Anonymous fields
		HasAnonymous: getBoooleanNotNull(),
		LockedByAnonId: Sequelize.STRING,
		LastAuthorAnonId: Sequelize.STRING,
		
		//Used for display
		Title: Sequelize.STRING //First line of dialogue?
	}, true),
	
	ComicPanel: defineTable('ComicPanel', {
		Ordinal: Sequelize.INTEGER,
		Value: Sequelize.STRING,
		Type: Sequelize.INTEGER, // Enum, eg. 1 'regular', 2 'whisper', 3 'yelling'
		ComicCompletedAt: Sequelize.DATE, //For queryability SCHEMA-TODO REMOVE
		SkipCount: getIntegerNotNull(),
		ReportCount: getIntegerNotNull(),
		CensoredAt: Sequelize.DATE
	}, true),

	ComicPanelSkip: defineTable('ComicPanelSkip'),

	ComicPanelReport: defineTable('ComicPanelReport'),

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

createOneToMany('ComicPanel', 'ComicPanelSkip');
createOneToMany('ComicPanel', 'ComicPanelReport');

createOneToMany('Template', 'TemplatePanel');
createOneToMany('Template', 'Comic');

createOneToMany('TemplatePanel', 'ComicPanel');
createOneToMany('TemplatePanel', 'Comic', 'NextTemplatePanel');

createOneToMany('Notification', 'UserNotification');

createOneToMany('User', 'Comic', 'LastAuthorUser', 'LastAuthoredComics');
createOneToMany('User', 'Comic', 'LockedByUser', 'LockedComics');
createOneToMany('User', 'ComicVote');
createOneToMany('User', 'ComicComment');
createOneToMany('User', 'UserNotification');
createOneToMany('User', 'ComicPanel');
createOneToMany('User', 'ComicPanelSkip');
createOneToMany('User', 'ComicPanelReport');

//Notification item FKS
createOneToMany('Comic', 'Notification'); // Will link to comicid
createOneToMany('User', 'Notification'); // Will link to user profile

module.exports = db;