// controllers/EntretienController.js
const { Entretien, Candidature, Offre, Utilisateur } = require('../models');
const { creerHistoriqueModification } = require('./HistoriqueModificationController');
const { creerNotification } = require('./NotificationController');
const { sendEntretienNotificationEmail } = require('../services/EmailService'); 
const { Op } = require('sequelize');

module.exports = {
  // Planifier un entretien
async  planifier(req, res) {
   console.log('Corps de la requête:', req.body); // Ajoutez ce log
  console.log('Paramètres:', req.params); // Ajoutez ce log
  const { date_entretien, heure_entretien } = req.body;
  const { id } = req.params; // id de la candidature
  const rh_id = req.user.userId;

  try {
    const candidature = await Candidature.findOne({
      where: { id },
      include: [
        {
          model: Offre,
          attributes: ['id', 'rh_id', 'entretien_requis', 'titre']
        },
        {
          model: Utilisateur,
          as: 'Candidat',
          attributes: ['email', 'prenom', 'id']
        }
      ]
    });

    if (!candidature) throw new Error('Candidature non trouvée');
    if (candidature.statut_candidature !== 'Presélectionnée') {
      throw new Error("L'entretien ne peut être planifié que pour une candidature présélectionnée");
    }
    if (candidature.Offre.rh_id !== rh_id) throw new Error('Non autorisé');
    if (!candidature.Offre.entretien_requis) {
      throw new Error("Cette offre ne nécessite pas d'entretien");
    }

    const entretienExistant = await Entretien.findOne({
      where: {
        candidature_id: id,
        statut: { [Op.ne]: 'Annulé' }
      }
    });

    if (entretienExistant) {
      throw new Error("Un entretien a déjà été planifié ou réalisé pour cette candidature");
    }

    const entretien = await Entretien.create({
      candidature_id: id,
      date_entretien,
      heure_entretien,
      statut: 'Planifié',
      resultat: null
    });

    await candidature.update({ statut_candidature: "Entretien planifié" });

    await creerHistoriqueModification({
      table_modifiee: 'Candidature',
      champ_modifie: 'statut_candidature',
      ancienne_valeur: 'Presélectionnée',
      nouvelle_valeur: "Entretien planifié",
      id_acteur: rh_id,
      candidature_id: candidature.id
    });

    const dateAffichage = `${date_entretien} à ${heure_entretien}`;

    await creerNotification({ 
      utilisateur_id: candidature.Candidat.id,
      titre: "Entretien planifié",
      message: `Un entretien a été planifié pour votre candidature à l'offre "${candidature.Offre.titre}" le ${dateAffichage}`,
      type: "entretien",
      lien_action: `/entretiens/${entretien.id}`,
      entretien_id: entretien.id
    });

    await sendEntretienNotificationEmail(
      candidature.Candidat.email,
      candidature.Candidat.prenom,
      candidature.Offre.titre,
      dateAffichage,
      'planification'
    );

    res.json({
      success: true,
      message: "Entretien planifié",
      entretien
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}


,
async modifierEntretien(req, res) {
  const { date_entretien, heure_entretien } = req.body;
  const { id } = req.params; // id de l'entretien
  const rh_id = req.user.userId;

  try {
    const entretien = await Entretien.findOne({
      where: {
        id,
        statut: { [Op.notIn]: ['Annulé', 'Passé'] } // empêche les modifications si "Passé"
      },
      include: [
        {
          model: Candidature,
          include: [
            {
              model: Offre,
              attributes: ['id', 'rh_id', 'entretien_requis', 'titre']
            },
            {
              model: Utilisateur,
              as: 'Candidat',
              attributes: ['email', 'prenom', 'id']
            }
          ]
        }
      ]
    });

    if (!entretien) {
      throw new Error("Entretien non trouvé, annulé ou déjà passé");
    }

    const candidature = entretien.Candidature;

    if (!candidature || candidature.Offre.rh_id !== rh_id) {
      throw new Error("Non autorisé à modifier cet entretien");
    }

    await entretien.update({ date_entretien, heure_entretien });

    const dateAffichage = `${date_entretien} à ${heure_entretien}`;
   
   
    await creerNotification({
      utilisateur_id: candidature.Candidat.id,
      titre: "Date d'entretien modifiée",
      message: `La date de votre entretien pour l'offre "${candidature.Offre.titre}" a été modifiée pour le ${dateAffichage}`,
      type: "entretien",
      lien_action: `/entretiens/${entretien.id}`,
      entretien_id: entretien.id
    });

    await sendEntretienNotificationEmail(
      candidature.Candidat.email,
      candidature.Candidat.prenom,
      candidature.Offre.titre,
      dateAffichage,
      'modification'
    );

    res.json({
      success: true,
      message: "Date d'entretien mise à jour",
      entretien
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

,
  // Annuler un entretien
async annuler(req, res) {
  const { id } = req.params; // id de l'entretien
  const rh_id = req.user.userId;

  try {
    const entretien = await Entretien.findOne({
      where: { id },
      include: [{
        model: Candidature,
        include: [
          {
            model: Offre,
            attributes: ['rh_id', 'titre']
          },
          {
            model: Utilisateur,
            as: 'Candidat',
            attributes: ['email', 'prenom']
          }
        ]
      }]
    });

    // Validations
    if (!entretien) throw new Error('Entretien non trouvé');
    if (entretien.Candidature.Offre.rh_id !== rh_id) {
      throw new Error('Non autorisé');
    }
    if (entretien.statut !== 'Planifié') {
      throw new Error('Seuls les entretiens planifiés peuvent être annulés');
    }

    const ancienneDate = entretien.date_entretien;
    const ancienStatut = entretien.statut;

    // Mise à jour : on annule l'entretien
    await entretien.update({ 
      statut: 'Annulé'
    });
await entretien.Candidature.update({ statut_candidature: 'Presélectionnée' });
    // Historisation
    await creerHistoriqueModification({
      table_modifiee: 'Entretien',
      champ_modifie: 'statut',
      ancienne_valeur: ancienStatut,
      nouvelle_valeur: 'Annulé',
      id_acteur: rh_id,
      id_entretien: id
    });

    // Notification dans l'application
    await creerNotification({
      utilisateur_id: entretien.Candidature.candidat_id,
      titre: "Entretien annulé",
      message: `Votre entretien pour "${entretien.Candidature.Offre.titre}" a été annulé`,
      type: "annulation_entretien",
      lien_action: `/mes-candidatures/${entretien.Candidature.id}`,
      entretien_id: id
    });

    // Envoi d'email
    await sendEntretienNotificationEmail(
      entretien.Candidature.Candidat.email,
      entretien.Candidature.Candidat.prenom,
      entretien.Candidature.Offre.titre,
      null,
      'annulation'
    );

    res.json({
      success: true,
      message: "Entretien annulé avec succès"
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}
,

  // Marquer un entretien comme terminé
  async terminer(req, res) {
    const { id } = req.params;
    const rh_id = req.user.userId;

    try {
      const entretien = await Entretien.findOne({
        where: { id },
        include: [{
          model: Candidature,
          include: [{
            model: Offre,
            attributes: ['rh_id']
          }]
        }]
      });

      // Validations
      if (!entretien) throw new Error('Entretien non trouvé');
      if (entretien.Candidature.Offre.rh_id !== rh_id) {
        throw new Error('Non autorisé');
      }

      // Mise à jour
      await entretien.update({
        statut: 'Passé'
      });

      // Historisation
      await creerHistoriqueModification({
        table_modifiee: 'Entretien',
        champ_modifie: 'statut',
        ancienne_valeur: entretien.statut,
        nouvelle_valeur: 'Passé',
        id_acteur: rh_id,
        id_entretien: id
      });

      res.json({
        success: true,
        message: "Entretien marqué comme passé"
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};