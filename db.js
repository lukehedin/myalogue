const Sequelize = require('sequelize');

//Heroku requires pg ssl, and will complain if this isn't set
const pg = require('pg');
pg.defaults.ssl = true;

// I think some of these configs might be excessive, but trying to be safe
const sequelize = new Sequelize(process.env.DATABASE_URL, {
	ssl: true,
    dialect: 'postgres',
	protocol: 'postgres',
    dialectOptions: {
		ssl: true
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
	Comic: defineTable('Comic', {
		Title: Sequelize.STRING,
		IsAnonymous: {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		Rating: {
			type: Sequelize.INTEGER,
			defaultValue: 0,
            allowNull: false
		}
	}, true),
	
	ComicDialogue: defineTable('ComicDialogue', {
		Value: Sequelize.STRING,
		Type: Sequelize.INTEGER, // Enum, eg. 1 'regular', 2 'whisper', 3 'yelling'
	}),

	ComicVote: defineTable('ComicVote', {
		Value: Sequelize.INTEGER
	}),

	ComicComment: defineTable('ComicComment', {
		Value: Sequelize.TEXT
	}, true),

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
		IsAdmin: {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: false
		}
	}, true),

	Game: defineTable('Game', {
		Description: Sequelize.TEXT,
		UnlockedAt: Sequelize.DATE,
		ImageUrl: Sequelize.STRING
	}, true),

	GameDialogue: defineTable('GameDialogue', {
		Ordinal: Sequelize.INTEGER,
		PositionX: Sequelize.INTEGER,
		PositionY: Sequelize.INTEGER,
		SizeX: Sequelize.INTEGER,
		SizeY: Sequelize.INTEGER
	})
};

// Associations

let createOneToMany = (belongsToTableName, hasManyTableName, hasManyAlias) => {
	let fk = `${belongsToTableName}Id`;
	if(!hasManyAlias) hasManyAlias = `${hasManyTableName}s`

	db[belongsToTableName].hasMany(db[hasManyTableName], { as: hasManyAlias, foreignKey: fk });
	db[hasManyTableName].belongsTo(db[belongsToTableName], { as: belongsToTableName, foreignKey: fk });
};

createOneToMany('Comic', 'ComicDialogue');
createOneToMany('Comic', 'ComicVote');
createOneToMany('Comic', 'ComicComment');

createOneToMany('Game', 'GameDialogue');
createOneToMany('Game', 'Comic');

createOneToMany('GameDialogue', 'ComicDialogue');

createOneToMany('User', 'Comic');
createOneToMany('User', 'ComicVote');
createOneToMany('User', 'ComicComment');

module.exports = db;