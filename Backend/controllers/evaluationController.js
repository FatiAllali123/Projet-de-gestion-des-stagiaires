const { Evaluation , Stage , Utilisateur } = require('../models');
const { creerNotification } = require('./NotificationController');
const { creerHistoriqueModification } = require('./HistoriqueModificationController');
module.exports = {

// Fonction pour créer une évaluation
  // Vérifie que l'utilisateur est un encadrant, que le stage existe et est en cours,
  // qu'aucune évaluation n'existe déjà pour ce stage, valide les notes et crée l'évaluation.
   async  creerEvaluation(req, res) {
   try {
    const { stage_id, comportement, travail_equipe, qualite_travail, adaptable, commentaire } = req.body;
    const encadrant_id = req.user.userId;

    // 1. Vérifier que l'utilisateur est bien un encadrant
    if (req.user.role !== 'encadrant') {
      return res.status(403).json({ message: "Seuls les encadrants peuvent créer des évaluations." });
    }

    // 2. Vérifier que le stage existe et que l'encadrant y est bien affecté
    const stage = await Stage.findOne({
      where: {
        id: stage_id,
        encadrant_id: encadrant_id
      }
    });

    if (!stage) {
      return res.status(404).json({ 
        message: "Stage non trouvé ou vous n'êtes pas l'encadrant de ce stage." 
      });
    }

    // 3. Vérifier que le stage est en cours (on ne peut évaluer que les stages en cours)
    if (stage.statut_stage !== 'Terminé') {
      return res.status(400).json({ 
        message: "Seuls les stages terminés peuvent être évalués." 
      });
    }

    // 4. Vérifier si une évaluation existe déjà pour ce stage
    const evaluationExistante = await Evaluation.findOne({
      where: { stage_id }
    });

    if (evaluationExistante) {
      return res.status(400).json({ 
        message: "Une évaluation existe déjà pour ce stage.",
        evaluation_id: evaluationExistante.id
      });
    }

    // 5. Validation des notes (entre 0 et 5 pour chaque critère)
    const notes = { comportement, travail_equipe, qualite_travail, adaptable };
    for (const [critere, note] of Object.entries(notes)) {
      if (note < 0 || note > 5) {
        return res.status(400).json({ 
          message: `La note pour ${critere} doit être entre 0 et 5.` 
        });
      }
    }

    // 6. Création de l'évaluation
    const evaluation = await Evaluation.create({
      stage_id,
      encadrant_id,
      comportement,
      travail_equipe,
      qualite_travail,
      adaptable,
      commentaire,
      date_evaluation: new Date()
    });

    // 7. Notification au stagiaire
    const stagiaire = await Utilisateur.findByPk(stage.Stagiaire_id);
    if (stagiaire) {
      await creerNotification({
        utilisateur_id: stagiaire.id,
        titre: "Nouvelle évaluation reçue",
        message: `Votre encadrant a évalué votre stage "${stage.sujet_stage}"`,
        type: 'Evaluation',
        lien_action: `/stagiaire/mes-stages/${stage.id}/evaluation`,
        stage_id: stage.id
      });
    }

    res.status(201).json({
      message: "Évaluation créée avec succès.",
    
    });

  } catch (error) {
    console.error("Erreur lors de la création de l'évaluation:", error);
    res.status(500).json({ 
      message: "Erreur serveur lors de la création de l'évaluation.",

    });
  }
},
// Fonction pour supprimer une évaluation par admin 
async supprimerEvaluation(req, res) {
  try {
    const { evaluation_id } = req.params;

    // 1. Vérification existence évaluation avec inclusion du Stage
    const evaluation = await Evaluation.findByPk(evaluation_id, {
      include: [{
        model: Stage,
        as: 'Stage', // Assurez-vous que c'est le bon alias (vérifiez vos associations)
        attributes: ['sujet_stage']
      }]
    });

    if (!evaluation) {
      return res.status(404).json({ 
        success: false,
        message: "Évaluation non trouvée." 
      });
    }

    // 2. Récupération du sujet avant suppression
    const sujet = evaluation.Stage?.sujet_stage || "Stage sans sujet"; // Fallback si undefined

    // 3. Suppression
    await evaluation.destroy();

    // 4. Notification
    await creerNotification({
      utilisateur_id: evaluation.encadrant_id,
      titre: "Évaluation supprimée - Action corrective",
      message: `Votre évaluation pour le stage "${sujet}" a été supprimée par l'administration.`,
      type: 'evaluation',
      lien_action: `/stages/${evaluation.stage_id}/reevaluation`,
    });

    res.status(200).json({
      success: true,
      message: "Évaluation supprimée avec succès.",
      deleted_id: evaluation_id
    });

  } catch (error) {
    console.error("Erreur suppression évaluation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression",
    });
  }
},

// Fonction pour récupérer une évaluation par l'identifiant du stage
async getEvaluationByStageId(req, res) {
  try {
    const stageId = req.params.stageId;

    const evaluation = await Evaluation.findOne({
      where: { stage_id: stageId },
      include: [
        {
          model: Stage,
          attributes: ['sujet_stage', 'date_debut', 'date_fin']
        },
        {
          model: Utilisateur,
          attributes: ['id', 'nom', 'prenom'],
          as: 'Utilisateur'
        }
      ]
    });

    if (!evaluation) {
      return res.status(404).json({ message: 'Évaluation non trouvée pour ce stage.' });
    }

    res.status(200).json({ evaluation });
  } catch (error) {
    console.error('Erreur lors de la récupération de l’évaluation :', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

};