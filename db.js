const Sequelize = require('sequelize');

//Heroku requires pg ssl, and will complain if this isn't set
const pg = require('pg');
pg.defaults.ssl = true;

// I think some of these configs might be excessive, but trying to be safe
const sequelize = new Sequelize(process.env.DATABASE_URL, {
	ssl: true,
    dialect: 'postgres',
	protocol: 'postgres',
    timezone: '+10:00',
    dialectOptions: {
        ssl: true
	}
});

const defineTable = (name, attributes, options = {}) => {
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
	
	op: Sequelize.Op,

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
		Name: Sequelize.STRING
	}),
	
	ComicDialogue: defineTable('ComicDialogue', {
		Value: Sequelize.STRING,
		Type: Sequelize.INTEGER, // Enum, eg. 1 'regular', 2 'whisper', 3 'yelling'
	}),

	ComicVote: defineTable('ComicVote', {
		Value: Sequelize.INTEGER
	}),

	ComicComment: defineTable('ComicComment', {
		Value: Sequelize.TEXT
	}),

	User: defineTable('User', {
		Email: Sequelize.STRING,
		Username: Sequelize.STRING,
		Password: Sequelize.STRING,
		VerificationToken: Sequelize.STRING,
		PasswordResetToken: Sequelize.STRING,
		PasswordResetAt: Sequelize.DATE,
		IsAdmin: {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: false
		}
	}),

	Template: defineTable('Template', {
		Name: Sequelize.STRING,
		UnlockedAt: Sequelize.DATE,
		ImageUrl: Sequelize.STRING,
		// Ordinal: Sequelize.INTEGER
	}),

	TemplateDialogue: defineTable('TemplateDialogue', {
		Placeholder: Sequelize.STRING,
		Ordinal: Sequelize.INTEGER,
		PositionX: Sequelize.INTEGER,
		PositionY: Sequelize.INTEGER,
		SizeX: Sequelize.INTEGER,
		SizeY: Sequelize.INTEGER,
		Max: Sequelize.INTEGER
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

createOneToMany('Template', 'TemplateDialogue');
createOneToMany('Template', 'Comic');

createOneToMany('TemplateDialogue', 'ComicDialogue');

createOneToMany('User', 'Comic');
createOneToMany('User', 'ComicVote');
createOneToMany('User', 'ComicComment');

module.exports = db;