'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

console.info('Instantiating and configuring the Sequelize object instance...');

const options = {
  dialect: 'sqlite',
  storage: 'fsjstd-restapi.db',
  define: {
    timestamps: true,
  },
  logging: false
};

const sequelize = new Sequelize(options);

const models = {};

// Import all of the models.
fs
  .readdirSync(path.join(__dirname, 'models'))
  .forEach((file) => {
    console.info(`Importing database model from file: ${file}`);
    const model = sequelize.import(path.join(__dirname, 'models', file));
    models[model.name] = model;
  });

// If available, call method to create associations.
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    console.info(`Configuring the associations for the ${modelName} model...`);
    models[modelName].associate(models);
  }
});

// Test connecting to database
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database successful!');
  } catch (error) {
    console.error('Error connecting to the database: ', error);
  }
})();

module.exports = {
  sequelize,
  Sequelize,
  models,
};
