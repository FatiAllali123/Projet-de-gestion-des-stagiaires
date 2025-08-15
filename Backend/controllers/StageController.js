const { Stage, Candidature, Utilisateur , Offre,Evaluation} = require('../models');
const { creerHistoriqueModification } = require('./HistoriqueModificationController');
const { creerNotification } = require('./NotificationController');
const { Op } = require('sequelize');
const { sendStageAssignmentEmail , sendEncadrantChangeEmail} = require('../services/EmailService');
const { Sequelize } = require('sequelize');
module.exports = {
async  creerStage(req, res) {
  try {
    const { sujet_stage, date_debut, date_fin, candidature_id } = req.body;
    const rh_id = req.user.userId; 

    // 1. Vérifier si la candidature est acceptée
    const candidature = await Candidature.findOne({ 
      where: { id: candidature_id },
      include: [{
        model: Utilisateur,
        as: 'Candidat',
        attributes: ['id', 'email', 'prenom']
      }]
    });

    if (!candidature) {
      return res.status(400).json({ message: "Candidature non trouvée." });
    }
    if (candidature.statut_candidature !== 'Acceptée') {
      return res.status(400).json({ message: "Candidature non valide pour un stage." });
    }

    // 2. Vérifier si un stage existe déjà pour cette candidature
    if (candidature.Stages && candidature.Stages.length > 0) {
      return res.status(400).json({ 
        code: 'STAGE_EXISTS',
        message: "Un stage a déjà été créé pour cette candidature." 
      });
    }
    
    // 2. Vérifier les conflits de dates
    const hasConflict = await Stage.findOne({
      where: {
        Stagiaire_id: candidature.candidat_id,
        [Op.or]: [
          {
            date_debut: { [Op.lte]: date_fin },
            date_fin: { [Op.gte]: date_debut }
          },
          {
            date_debut: { [Op.gte]: date_debut },
            date_fin: { [Op.lte]: date_fin }
          }
        ],
        statut_stage: {
          [Op.or]: ['En cours', 'Planifié']
        }
      },
      attributes: ['id'] // On ne récupère que l'id pour optimiser
    });

    if (hasConflict) {
      return res.status(400).json({ 
        message: "Ce candidat a déjà un stage planifié ou en cours pendant cette période." 
      });
    }

    // 3. Créer le stage
    const statut_stage = new Date(date_debut) > new Date() ? 'Planifié' : 'En cours';

    const stage = await Stage.create({
      sujet_stage,
      date_debut,
      date_fin,
      statut_stage,
      Stagiaire_id: candidature.candidat_id, 
      candidature_id
    });

    // 4. Créer notification
    await creerNotification({
      utilisateur_id: candidature.candidat_id,
      titre: 'Nouveau stage attribué',
      message: `Un stage vous a été attribué : ${sujet_stage}`,
      type: 'Stage',
      lien_action: `/stagiaire/mes-stages/${stage.id}`,
      stage_id: stage.id,
      candidature_id: candidature_id
    });

    // 5. Envoyer l'email
    if (candidature.Candidat?.email) {
      await sendStageCreationEmail(
        candidature.Candidat.email, 
        candidature.Candidat.prenom, 
        sujet_stage, 
        date_debut, 
        date_fin
      );
    }

    return res.status(201).json({ 
      message: "Stage créé avec succès.",
      stage: {
        id: stage.id,
        sujet_stage: stage.sujet_stage,
        date_debut: stage.date_debut,
        date_fin: stage.date_fin,
        statut_stage: stage.statut_stage
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      message: "Erreur lors de la création du stage." 
    });
  }
},

async affecterEncadrant(req, res) {
  try {
    const { stageId } = req.params;
    const { encadrantId } = req.body;

    // Vérifier que le stage existe
    const stage = await Stage.findByPk(stageId);
    if (!stage) {
      return res.status(404).json({ message: "Stage non trouvé." });
    }

    // Vérifier que l'encadrant existe et a le bon rôle
    const encadrant = await Utilisateur.findByPk(encadrantId);
    if (!encadrant || encadrant.role !== 'encadrant') {
      return res.status(400).json({ message: "Encadrant non valide." });
    }

    // Affecter l'encadrant au stage
    stage.encadrant_id = encadrantId;
    await stage.save();

    // Envoyer un email à l'encadrant
    await sendStageAssignmentEmail(
      encadrant.email,
      encadrant.prenom,
      stage.sujet_stage,
      stage.date_debut,
      stage.date_fin
    );

    // Créer une notification interne
    await creerNotification({
      utilisateur_id: encadrant.id,
      titre: "Affectation à un stage",
      message: `Vous avez été affecté au stage : ${stage.sujet_stage}`,
      type: 'affectation_stage',
      lien_action: `/stages/${stage.id}`,
      stage_id: stage.id
    });

    res.status(200).json({ message: "Encadrant affecté avec succès." });

  } catch (error) {
    console.error("Erreur d'affectation :", error);
    res.status(500).json({ message: "Erreur lors de l'affectation de l'encadrant." });
  }
},

async changerEncadrantStage(req, res) {
  try {
    const { stageId } = req.params;
    const { nouveauEncadrantId } = req.body;
    const acteurId = req.user.userId; // ID de l'utilisateur qui effectue le changement

    // 1. Récupérer le stage et vérifier son existence
    const stage = await Stage.findByPk(stageId, {
      include: [
        {
          model: Utilisateur,
          as: 'Encadrant',
          attributes: ['id', 'email', 'nom', 'prenom']
        }
      ]
    });
    
    if (!stage) {
      return res.status(404).json({ message: "Stage non trouvé." });
    }

    // 2. Vérifier si le nouvel encadrant est le même que l'actuel
    if (stage.encadrant_id === nouveauEncadrantId) {
      return res.status(200).json({ 
        message: "Aucun changement effectué - le nouvel encadrant est le même que l'actuel.",
        encadrantActuel: stage.Encadrant ? { 
          id: stage.Encadrant.id, 
          nom: stage.Encadrant.nom, 
          prenom: stage.Encadrant.prenom 
        } : null
      });
    }

    // 3. Vérifier le nouvel encadrant

    const nouveauEncadrant = await Utilisateur.findByPk(nouveauEncadrantId);
    if (!nouveauEncadrant || nouveauEncadrant.role !== 'encadrant') {
      return res.status(400).json({ message: "Nouvel encadrant non valide." });
    }

    // 4. Sauvegarder l'ancien encadrant pour les notifications
    const ancienEncadrant = stage.Encadrant;
    const ancienEncadrantId = stage.encadrant_id;

    // 5. Effectuer le changement
    stage.encadrant_id = nouveauEncadrantId;
    await stage.save();

    // 6. Historiser le changement
    await creerHistoriqueModification({
      table_modifiee: 'Stage',
      champ_modifie: 'encadrant_id',
      ancienne_valeur: ancienEncadrantId?.toString() || 'null',
      nouvelle_valeur: nouveauEncadrantId.toString(),
      id_acteur: acteurId,
      id_stage: stageId
    });

    // 7. Notifier l'ancien encadrant (si existant)
    if (ancienEncadrant) {
      // Notification
      await creerNotification({
        utilisateur_id: ancienEncadrant.id,
        titre: "Changement d'affectation",
        message: `Vous n'êtes plus encadrant du stage "${stage.sujet_stage}"`,
        type: 'changement_affectation',
        lien_action: `/stages/${stage.id}`,
        stage_id: stage.id
      });

      // Email
      await sendEncadrantChangeEmail(
        ancienEncadrant.email,
        ancienEncadrant.prenom,
        stage.sujet_stage,
        'retrait'
      );
    }

    // 8. Notifier le nouvel encadrant
    // Notification
    await creerNotification({
      utilisateur_id: nouveauEncadrantId,
      titre: "Nouvelle affectation",
      message: `Vous avez été assigné comme encadrant du stage "${stage.sujet_stage}"`,
      type: 'nouvelle_affectation',
      lien_action: `/stages/${stage.id}`,
      stage_id: stage.id
    });

    // Email
    await sendEncadrantChangeEmail(
      nouveauEncadrant.email,
      nouveauEncadrant.prenom,
      stage.sujet_stage,
      'ajout',
      stage.date_debut,
      stage.date_fin
    );

    res.status(200).json({ 
      message: "Encadrant changé avec succès.",
      ancienEncadrant: ancienEncadrant ? { 
        id: ancienEncadrant.id, 
        nom: ancienEncadrant.nom, 
        prenom: ancienEncadrant.prenom 
      } : null,
      nouveauEncadrant: { 
        id: nouveauEncadrant.id, 
        nom: nouveauEncadrant.nom, 
        prenom: nouveauEncadrant.prenom 
      }
    });

  } catch (error) {
    console.error("Erreur lors du changement d'encadrant:", error);
    res.status(500).json({ message: "Erreur lors du changement d'encadrant." });
  }
},
async getStageDetails(req, res) {
  try {
    const { id } = req.params;

    const stage = await Stage.findByPk(id, {
      include: [
        {
          model: Utilisateur,
          as: 'Encadrant',
          attributes: ['id', 'nom', 'prenom', 'email', 'specialite_encadrant']
        },
        {
          model: Utilisateur,
          as: 'Stagiaire',
          attributes: ['id', 'nom', 'prenom', 'email','telephone','niveau_etudes','etablissement']
        },
        {
          model: Candidature,
          attributes: ['id'],
          include: [
            {
              model: Offre,
              attributes: ['mode_stage', 'type_stage'] // juste les champs voulus
            }
          ]
        }
      ]
    });

    if (!stage) {
      return res.status(404).json({ message: "Stage non trouvé." });
    }

    res.json(stage);
  } catch (error) {
    console.error("Erreur lors de la récupération du stage :", error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
},
//fonction pour récupérer les stages actifs cad en cours ou planifiés 
async getStagesActifs(req, res) {
  try {
    const stages = await Stage.findAll({
      where: {
        statut_stage: {
          [Op.or]: ['En cours', 'Planifié']
        }
      },
      include: [
        {
          model: Utilisateur,
          as: 'Stagiaire',
          attributes: ['id', 'nom', 'prenom','email','telephone','niveau_etudes','etablissement']
        },
        {
          model: Utilisateur,
          as: 'Encadrant',
          attributes: ['id', 'nom', 'prenom','email']
        },
        {
          model: Candidature,
          attributes: ['id'],
          include: [
            {
              model: Offre,
              attributes: ['mode_stage', 'type_stage'] // juste les champs voulus
            }
          ]
        }
      ],
      order: [['date_debut', 'ASC']]
    });

    res.json(stages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
},
// Fonction pour récupérer l'historique des stages terminés
async getHistoriqueStages(req, res) {
  try {
    const stages = await Stage.findAll({
      where: {
        statut_stage: 'Terminé'
      },
      include: [
        {
          model: Utilisateur,
          as: 'Stagiaire',
          attributes: ['id', 'nom', 'prenom','email','telephone','niveau_etudes','etablissement']
        },
        {
          model: Utilisateur,
          as: 'Encadrant',
          attributes: ['id', 'nom', 'prenom','email']
        },
        {
          model: Candidature,
          attributes: ['id'],
          include: [
            {
              model: Offre,
              attributes: ['mode_stage', 'type_stage'] // juste les champs voulus
            }
          ]
        }
      ],
      order: [['date_fin', 'DESC']]
    });

    res.json(stages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
},
// Fonction pour vérifier si un candidat a un stage actif cad  planifié ou En cours
async  checkActiveStage(req, res) {
  try {
    const { candidatId } = req.params;

    // Vérifier que l'utilisateur est un candidat
    const isCandidat = await Utilisateur.findOne({
      where: { 
        id: candidatId,
        role: 'candidat' 
      },
      attributes: ['id']
    });

    if (!isCandidat) {
      return res.status(404).json({ 
        success: false,
        message: "Candidat non trouvé" 
      });
    }

    // Récupérer les stages actifs du candidat
    const stages = await Stage.findAll({
      where: {
        Stagiaire_id: candidatId,
        statut_stage: {
          [Op.or]: ['En cours', 'Planifié']
        }
      },
      attributes: ['id', 'date_debut', 'date_fin', 'statut_stage'],
      order: [['date_debut', 'ASC']],
      raw: true
    });

    if (stages.length === 0) {
      return res.status(200).json({ 
        hasActiveStage: false,
        message: "Aucun stage actif ou planifié"
      });
    }

    // Formater la réponse avec tous les stages trouvés
    const response = {
      hasActiveStage: true,
      stages: stages.map(stage => ({
        id: stage.id,
        date_debut: stage.date_debut,
        date_fin: stage.date_fin,
        statut: stage.statut_stage
      })),
      count: stages.length
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("Erreur vérification stage actif:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur" 
    });
  }
},

// Fonction pour que stagaire  récupére ses stages  avec possibilité de filtrer par statut
async  getStagiaireStages(req, res) {
  try {
    
    const { statut } = req.query;
    const userId = req.user.userId; 
 

    // Construction du filtre
    const whereClause = {
      Stagiaire_id: userId
    };

    // Filtre par statut si spécifié
    if (statut && ['En cours', 'Planifié', 'Terminé'].includes(statut)) {
      whereClause.statut_stage = statut;
    } else if (!statut) {
      // Par défaut, montre tous les stages (sans filtre)
      whereClause.statut_stage = {
        [Op.or]: ['En cours', 'Planifié', 'Terminé']
      };
    } else {
      return res.status(400).json({ message: "Statut invalide. Choisissez entre: En cours, Planifié, Terminé" });
    }

    // Récupération des stages
    const stages = await Stage.findAll({
      where: whereClause,
      attributes: ['id', 'sujet_stage', 'date_debut', 'date_fin', 'statut_stage'],
      include: [
        {
          model: Utilisateur,
          as: 'Encadrant',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: Candidature,
          attributes: ['id'],
          include: [
            {
              model: Offre,
              attributes: ['mode_stage', 'type_stage'] // juste les champs voulus
            }
          ]
        }
      ],
      order: [['date_debut', statut === 'Terminé' ? 'DESC' : 'ASC']]
    });

    if (stages.length === 0) {
      return res.status(200).json({ 
        message: statut 
          ? `Aucun stage ${statut.toLowerCase()} trouvé.`
          : "Aucun stage trouvé."
      });
    }

    res.json(stages);

  } catch (error) {
    console.error(error);
    
    res.status(500).json({ message: "Erreur serveur" });
  }
},
// Fonction pour  récupérer les stages d'un encadrant avec possibilité de filtrer par statut
async  getEncadrantStages(req, res) {
  try {
    const { id } = req.params;
    const { statut } = req.query;
    const userId = req.user.userId; // ID de l'utilisateur connecté
    const userRole = req.user.role; // Rôle de l'utilisateur connecté

   
   

    let whereClause = {
      encadrant_id: id
    };

    // Filtre par statut si spécifié
    if (statut) {
      whereClause.statut_stage = statut;
    }

    // Pour les encadrants, on ne montre que les stages actifs ou planifiés par défaut
    if (userRole === 'encadrant' && !statut) {
      whereClause.statut_stage = {
        [Op.or]: ['En cours']
      };
    }

    const stages = await Stage.findAll({
      where: whereClause,
      attributes: ['id', 'sujet_stage', 'date_debut', 'date_fin', 'statut_stage'],
      include: [
        {
          model: Utilisateur,
          as: 'Stagiaire',
          attributes: ['id', 'nom', 'prenom' , 'email','telephone','niveau_etudes','etablissement']
        }
      ],
      order: [['date_debut', 'ASC']]
    });

    if (stages.length === 0) {
      return res.status(200).json({ message: "Aucun stage trouvé." });
    }

    res.json(stages);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des stages.' });
  }
}
,



async getStagesEvaluationPending(req, res) {
  try {
    // ID de l'encadrant connecté
    const encadrantId = req.user.userId;

    const stages = await Stage.findAll({
      where: {
        statut_stage: 'Terminé',
        encadrant_id: encadrantId
      },
      include: [
        { model: Utilisateur, as: 'Stagiaire' },
        { 
          model: Evaluation,
          required: false, // left join
          where: { id: null } // récupère seulement les stages sans évaluation
        }
      ]
    });

    res.json(stages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}


};