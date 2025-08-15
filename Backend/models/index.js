// models/index.js
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const sequelize = require('../config/db'); // la connexion avec db

const db = {};

// Charge AUTOMATIQUEMENT tous les modèles
fs.readdirSync(__dirname)
  .filter(file => file.endsWith('.js') && file !== 'index.js')
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Configure AUTOMATIQUEMENT les relations
Object.values(db).forEach(model => {
  if (model.associate) model.associate(db);
});

module.exports = { ...db, sequelize };