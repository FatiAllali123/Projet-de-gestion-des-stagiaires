const cron = require('node-cron');
const { Stage } =  require('./models');
const { Op } = require("sequelize");
cron.schedule('0 0 * * *', async () => {
      console.log("Cette tâche s’exécute toutes les minuits");
  const today = new Date().toISOString().split('T')[0];

  try {
    // Passer de "planifié" à "en cours"
    await Stage.update(
      { statut_stage: 'En cours' },
      {
        where: {
          date_debut: today,
          statut_stage: 'Planifié'
        }
      }
    );

    // Passer de "en cours" à "terminé"
    await Stage.update(
      { statut_stage: 'Terminé' },
      {
        where: {
          date_fin: { [Op.lt]: today },
          statut_stage: 'En cours'
        }
      }
    );

    console.log(`Statuts de stages mis à jour pour la date : ${today}`);
  } catch (err) {
    console.error('Erreur mise à jour des statuts stages:', err);
  }
});
