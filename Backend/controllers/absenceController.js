const { Absence , Stage , Document  } = require('../models');


async function marquerAbsence(req, res) {
  try {
    const { stage_id, date_absence } = req.body;
    const encadrant_id = req.user.userId;

    // 1. Vérification du rôle
    if (req.user.role !== 'encadrant') {
      return res.status(403).json({ 
        success: false,
        message: "Action réservée aux encadrants." 
      });
    }

    // 2. Vérification du stage
    const stage = await Stage.findByPk(stage_id, {
      attributes: ['id', 'date_debut', 'date_fin', 'sujet_stage', 'Stagiaire_id', 'statut_stage'],
      where: { encadrant_id }
    });

    if (!stage) {
      return res.status(404).json({ 
        success: false,
        message: "Stage non trouvé ou non autorisé." 
      });
    }

    // 3. Vérification que le stage est bien "En cours"
    if (stage.statut_stage !== 'En cours') {
      return res.status(400).json({
        success: false,
        message: "Les absences ne peuvent être enregistrées que pour les stages en cours.",
        current_status: stage.statut_stage
      });
    }

    // 4. Validation de la date
    const dateAbs = new Date(date_absence);
    const debutStage = new Date(stage.date_debut);
    const finStage = new Date(stage.date_fin);

    if (dateAbs < debutStage || dateAbs > finStage) {
      return res.status(400).json({
        success: false,
        message: `Date invalide. Période du stage: ${stage.date_debut} au ${stage.date_fin}`,
        valid_range: {
          start: stage.date_debut,
          end: stage.date_fin
        }
      });
    }

    // 5. Vérification des doublons
    const absenceExistante = await Absence.findOne({
      where: { stage_id, date_absence },
      attributes: ['id']
    });

    if (absenceExistante) {
      return res.status(409).json({
        success: false,
        message: "Absence déjà existante pour cette date.",
        existing_id: absenceExistante.id
      });
    }

    // 6. Création de l'absence (toujours non justifiée)
    const nouvelleAbsence = await Absence.create({
      stage_id,
      date_absence,
      is_justified: false,
      justificatif_id: null
    });

    res.status(201).json({
      success: true,
      message: "Absence non justifiée enregistrée avec succès.",
      data: {
        id: nouvelleAbsence.id,
        date: nouvelleAbsence.date_absence,
        justified: false
      }
    });

  } catch (error) {
    console.error(`Erreur marquerAbsence: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur technique",
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack 
      })
    });
  }
};


// fonction pour get abscences d'un stage

const getAbsencesByStageId = async (req, res) => {
  try {
    const { stageId } = req.params;

    const stage = await Stage.findByPk(stageId, {
      include: [{
        model: Absence,
        required: false // au cas où il n'y a pas d'absences
      }]
    });

    if (!stage) {
      return res.status(404).json({ message: 'Stage non trouvé' });
    }

    return res.status(200).json({
      absences: stage.Absences
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des absences :', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};



async function checkIsJustified(req, res) {
  try {
    const { absence_id } = req.params;

    // 1. Trouver l'absence
    const absence = await Absence.findByPk(absence_id, {
      attributes: ['id', 'is_justified']
    });

    if (!absence) {
      return res.status(404).json({
        success: false,
        message: "Absence non trouvée."
      });
    }

    // 2. Vérifier s'il existe un justificatif associé à cette absence
    const justificatif = await Document.findOne({
      where: { 
        absence_id: absence_id,
        type: "justificatif d'absence" 
      },
      attributes: ['id', 'statut']
    });

    res.status(200).json({
      success: true,
      isJustified: absence.is_justified,
      hasJustificatif: !!justificatif, // true si un justificatif existe
      justificatifStatus: justificatif?.statut || null // statut du justificatif si existe
    });

  } catch (error) {
    console.error(`Erreur checkIsJustified: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur technique",
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack 
      })
    });
  }
}



module.exports = {
  marquerAbsence,
  checkIsJustified,
  getAbsencesByStageId
};