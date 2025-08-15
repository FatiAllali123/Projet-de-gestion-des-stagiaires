const express = require('express');
const app = express();
const { sequelize } = require('./models');
const cors = require('cors'); // Importez le package
const path = require('path');
// Autorise les requêtes depuis http://localhost:4200 (Angular)
app.use(cors({
  origin: 'http://localhost:4200', 
  credentials: true, 
}));

// Middleware pour parser le JSON
app.use(express.json());
// Pour accéder aux fichiers via http://localhost:3000/uploads/...
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Import des routes 
const utilisateurRoutes = require('./routes/utilisateurRoutes');
const passwordresetRoutes = require('./routes/passwordResetRoutes');
const authRoutes = require('./routes/authRoutes');
const notificationsRoutes = require('./routes/notificationRoutes');
const offresRoutes = require('./routes/OffreRoutes');
const candidatureRoutes = require('./routes/candidatureRoutes');
const entretienRoutes = require('./routes/EntretienRoutes');
const stageRoutes = require('./routes/StageRoutes');
const evaluationRoutes = require('./routes/EvaluationRoutes');
const absenceRoutes = require('./routes/absenceRoutes');
const documentRoutes = require('./routes/DocumentsRoutes');
const propositionRoutes = require('./routes/propositionDatesRoutes');
// Utilisation des routes
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/resetpassword', passwordresetRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications',notificationsRoutes );
app.use('/api/offres',offresRoutes );
app.use('/api/candidatures',candidatureRoutes );
app.use('/api/entretiens',entretienRoutes );
app.use('/api/stages',stageRoutes );
app.use('/api/evaluations',evaluationRoutes );
app.use('/api/absences',absenceRoutes );
app.use('/api/documents',documentRoutes );
app.use('/api/propositions', propositionRoutes);
// Middleware pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});


// Synchronisation (à faire une fois au démarrage)
async function initDB() {
  try {
    await sequelize.sync({ alter: true }); // Option 'alter' pour mettre à jour le schéma sans supprimer les données
    console.log('Base de données synchronisée !');
  } catch (error) {
    console.error('Erreur de synchronisation :', error);
  }
}
/* expliquation 
Cette fonction compare les modèles Sequelize avec les tables existantes en BDD et Met à jour les tables (ajoute/modifie des colonnes) sans supprimer les données pour les faire correspondre.
Si On ajoute un champ tel à  modèle Utilisateur 
Avec alter: true, Sequelize ajoutera la colonne tel à la table existante.
Sans synchronisation, la colonne serait manquante et les requêtes échoueraient.
*/
initDB();
module.exports = app;



