const Sequelize = require('sequelize');

//Heroku requires pg ssl, and will complain if this isn't set
const pg = require('pg');
pg.defaults.ssl = true;

const sequelize = new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres', ssl: true });

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
			force: true
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
		Dialogue: Sequelize.STRING,
		Type: Sequelize.INTEGER, // Enum, eg. 1 'regular', 2 'whisper', 3 'yelling'
	}),

	ComicVote: defineTable('ComicVote', {

	}),

	User: defineTable('User', {
		Email: Sequelize.STRING,
		UserName: Sequelize.STRING,
	}),

	Template: defineTable('Template', {
		Name: Sequelize.STRING,
		UnlockedAt: Sequelize.DATE
	}),

	TemplateDialogue: defineTable('TemplateDialogue', {
		Ordinal: Sequelize.INTEGER // Might have 2 dialogue on a panel = 2 rows with same ordinal
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
createOneToMany('Template', 'TemplateDialogue');


let createOneToOne = (belongsToTableName, hasOneTableName) => {
	let fk = `${belongsToTableName}Id`;

	db[belongsToTableName].hasOne(db[hasOneTableName], {as: hasOneTableName, foreignKey : fk });
	db[hasOneTableName].belongsTo(db[belongsToTableName], {as: belongsToTableName, foreignKey : fk});
};

createOneToOne('Comic', 'User');
createOneToOne('ComicDialogue', 'TemplateDialogue');

module.exports = db;