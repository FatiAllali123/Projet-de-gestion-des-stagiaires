// backend/config/db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('gestion_stagiaires', 'postgres', 'Allali20!.', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false,
});

//  Test de connexion
sequelize.authenticate()
  .then(() => {
    console.log('✅ Connexion à la base de données PostgreSQL réussie.');
  })
  .catch((err) => {
    console.error('❌ Impossible de se connecter à la base de données :', err.message);
  });

module.exports = sequelize;
