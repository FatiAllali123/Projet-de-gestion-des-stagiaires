
const cron = require('node-cron');
const { Entretien } = require('./models');
const { Op, literal } = require('sequelize');

const now = new Date();
const today = now.toISOString().split('T')[0]; // yyyy-mm-dd
const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

// Ce cron s'exécute toutes les minutes pour tester
cron.schedule('*/5 * * * *', async () => {
  console.log('🔄 [CRON] Vérification des entretiens planifiés...');

  try {
    const now = new Date();

    // Récupère tous les entretiens planifiés dont date + heure sont dépassées
const entretiens = await Entretien.findAll({
  where: {
    statut: 'Planifié',
    [Op.or]: [
      { date_entretien: { [Op.lt]: today } }, // date déjà passée
      {
        date_entretien: today,
        heure_entretien: { [Op.lte]: currentTime } // même jour mais heure passée
      }
    ]
  }
});

    for (const entretien of entretiens) {
      await entretien.update({ statut: 'Passé' });
      console.log(`✅ Entretien #${entretien.id} marqué comme "Passé"`);
    }
  } catch (error) {
    console.error('❌ Erreur CRON entretiens :', error);
  }
});
