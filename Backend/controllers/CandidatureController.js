// controllers/CandidatureController.js
const { Candidature, Offre, Utilisateur,Entretien , Stage,PropositionDates} = require('../models');
const { creerHistoriqueModification } = require('./HistoriqueModificationController');
const { creerNotification } = require('./NotificationController');
const { Op } = require('sequelize');
const { sendCandidatureStatusEmail } = require('../services/EmailService'); 

  // Postuler à une offre
const fs = require('fs');
const path = require('path');

async function postuler(req, res) {
  const candidat_id = req.user.userId;
  const { offre_id } = req.body;

  // chemins des fichiers uploadés

const cvAbsolutePath = req.files['cv']?.[0]?.path;
const lettreAbsolutePath = req.files['lettre_motivation']?.[0]?.path;

const cvRelativePath = getRelativePath(cvAbsolutePath);
const lettreRelativePath = getRelativePath(lettreAbsolutePath);

 // Fonction utilitaire pour supprimer les fichiers
  const deleteFiles = () => {
    if (cvRelativePath) fs.unlink(cvRelativePath, err => err && console.error('Erreur suppression CV:', err));
    if (lettreRelativePath) fs.unlink(lettreRelativePath, err => err && console.error('Erreur suppression lettre:', err));
  }
  
  // Fonction utilitaire pour supprimer les fichiers
 if (!cvAbsolutePath || !lettreAbsolutePath) {
  deleteFiles();
  return res.status(400).json({ message: "CV et lettre requis" });
}

  try {
    const offre = await Offre.findByPk(offre_id);
    if (!offre) {
      deleteFiles();
      return res.status(404).json({ message: "Offre non trouvée" });
    }

    if (offre.statut_offre !== 'actif') {
      deleteFiles();
      return res.status(400).json({ message: "Offre inactive" });
    }

    const existingApplication = await Candidature.findOne({
      where: { offre_id, candidat_id }
    });

    if (existingApplication) {
      deleteFiles();
      return res.status(400).json({ 
        message: "Vous avez déjà postulé à cette offre",
        candidature_id: existingApplication.id
      });
    }

if (!cvRelativePath || !lettreRelativePath) {
  deleteFiles();
  return res.status(500).json({ message: "Erreur lors du traitement des fichiers" });
}

    const candidature = await Candidature.create({
      statut_candidature: "En cours d'execution",
      date_creation: new Date(),
      cv: cvRelativePath,
      lettre_motivation: lettreRelativePath,
      offre_id,
      candidat_id
    });

    res.status(201).json({
      message: "Candidature envoyée avec succès",
      candidature
    });

}
 catch (error) {
    deleteFiles();
    console.error(error);
    res.status(500).json({ 
      message: "Erreur lors de la candidature",
      error: error.message 
    });
  }
}

  // Vérifier si l'utilisateur a déjà postulé à une offre
  async function checkAlreadyApplied(req, res) {
    const { offre_id } = req.params;
    const candidat_id = req.user.userId;

    try {
      const candidature = await Candidature.findOne({
        where: {
          offre_id,
          candidat_id
        },
        attributes: ['id', 'statut_candidature', 'date_creation']
      });

      res.json({
        hasApplied: !!candidature,
        candidature: candidature || null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Récupérer les candidatures d'un utilisateur et option filtrage avec statut 
  async function getMesCandidatures(req, res) {
    const candidat_id = req.user.userId;
  const { statut } = req.query; // Récupère le paramètre de filtrage
    try {

      // Construction de la clause where
    const whereClause = { candidat_id };
    
    // Ajout du filtre par statut si spécifié
    if (statut) {
      whereClause.statut_candidature = statut;
    }
      const candidatures = await Candidature.findAll({
        where: whereClause,
        include: [{ // Inclure les informations de l'offre associée
          model: Offre,
          attributes: ['id', 'titre', 'description', 'statut_offre' ,'duree' , 'mode_stage' , 'type_stage' , 'competences_requises', 'entretien_requis' ]
        },
             {
          model: PropositionDates,
           as: 'PropositionsDates', 
           required : false ,
          attributes: ['id', 'date_debut_proposee', 'date_fin_proposee', 'statut', 'commentaire', 'date_proposition', 'date_traitement']
        },
              {
          model: Entretien,
           required : false ,
          attributes: ['id', 'date_entretien', 'heure_entretien'],
          where: {
                        statut: 'Planifié' // Seuls les entretiens avec statut 'planifié'
                    }
        }
      ],
        order: [['date_creation', 'DESC']]
      });

      res.json(candidatures);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  // Annuler une candidature (seulement si statut "En attente")
async function annulerCandidature(req, res) {
  const { id } = req.params;
  const candidat_id = req.user.userId;

  try {
    // Trouver la candidature
    const candidature = await Candidature.findByPk(id);
    
    // Vérifications
    if (!candidature) {
      return res.status(404).json({ message: "Candidature non trouvée" });
    }

    if (candidature.candidat_id !== candidat_id) {
      return res.status(403).json({ message: "Non autorisé - Ce n'est pas votre candidature" });
    }

    if (candidature.statut_candidature !== 'En cours d\'execution') {
      return res.status(400).json({ 
        message: "Impossible d'annuler - La candidature est déjà traitée",
        current_status: candidature.statut_candidature
      });
    }

    // Sauvegarder l'ancien statut
    const ancienStatut = candidature.statut_candidature;

    // Mettre à jour le statut
    await candidature.update({ 
      statut_candidature: 'Annulée'
    
    });

    // Historisation
    await creerHistoriqueModification({
      table_modifiee: 'Candidature',
      champ_modifie: 'statut_candidature',
      ancienne_valeur: ancienStatut,
      nouvelle_valeur: 'Annulée',
      id_acteur: candidat_id,
      id_candidature: candidature.id
    });

    res.json({ 
      message: "Candidature annulée avec succès",
      candidature: {
        id: candidature.id,
        statut: 'Annulée',
        offre_id: candidature.offre_id
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: "Erreur lors de l'annulation de la candidature",
      error: error.message 
    });
  }
}
// Récupérer toutes les candidatures pour une offre (pour RH)
async function getCandidaturesPourOffre(req, res) {
  const { offre_id } = req.params;
  const { statut_candidature } = req.query;
  const rh_id = req.user.userId;

  try {
    // Vérifie que l'offre appartient bien au RH
    const offre = await Offre.findOne({
      where: {
        id: offre_id,
        rh_id: rh_id
      }
    });

    if (!offre) {
      return res.status(403).json({ message: "Non autorisé ou offre inexistante" });
    }

    // Construire dynamiquement le where
    const whereClause = {
      offre_id,
      statut_candidature: {
        [Op.ne]: "Annulée"  // ← Exclure les candidatures annulées
      }
    };

    if (statut_candidature) {
      whereClause.statut_candidature = statut_candidature;
    }

    const candidatures = await Candidature.findAll({
      where: whereClause,
      include: [
        {
          model: Utilisateur,
          as: 'Candidat',
          attributes: ['id', 'nom', 'prenom', 'email','telephone' , 'niveau_etudes' , 'etablissement']
        },
        {
          model: Entretien,
          
          attributes: ['id', 'date_entretien', 'statut', 'heure_entretien' ]
        },
        {
      model: Stage, 
      as: 'Stage',
      attributes: ['id' , 'date_debut' , 'date_fin' ]  
    },
      {
      model: PropositionDates,
      as: 'PropositionsDates',
      required: false,
      attributes: ['id', 'date_debut_proposee', 'date_fin_proposee', 'statut']
    }
      ],
      order: [['date_creation', 'DESC']]
    });

    res.json({
      offre: {
        id: offre.id,
        titre: offre.titre,
        entretien_requis: offre.entretien_requis,
        description : offre.description,
      },
      candidatures
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
}

// Fonction utilitaire pour exécuter les actions sur les candidatures
async function executerActionCandidature({
  candidatureId,
  rhId,
  nouveauStatut,
  validationEntretien = false
}) {
  const candidature = await Candidature.findOne({
    where: { id: candidatureId },
    include: [
      {
        model: Offre,
        attributes: ['id', 'titre', 'entretien_requis', 'rh_id']
      },
      {
        model: Entretien,
        required: false
      },
      {
        model: Utilisateur,
        as: 'Candidat',
        attributes: ['id', 'email', 'prenom', 'nom']
      }
    ]
  });

  if (!candidature) throw new Error('Candidature non trouvée');
  if (candidature.Offre.rh_id !== rhId) throw new Error('Non autorisé');
if (['Acceptée', 'Refusée'].includes(candidature.statut_candidature)) {
  if (candidature.statut_candidature === nouveauStatut) {
    throw new Error(`La candidature est déjà ${nouveauStatut.toLowerCase()}`);
  } else {
    throw new Error(`Impossible de changer une candidature déjà ${candidature.statut_candidature.toLowerCase()}`);
  }
}

  if (validationEntretien) {
    const entretiensValides = (candidature.Entretiens || []).filter(e => e.statut !== 'Annulé');

    if (entretiensValides.length === 0) {
      throw new Error("Entretien requis mais aucun entretien valide trouvé");
    }

    const entretienTerminé = entretiensValides.find(e => e.statut === 'Passé');

    if (!entretienTerminé) {
      throw new Error("L'entretien doit être terminé pour cette action");
    }
  }

  const ancienStatut = candidature.statut_candidature;
  await candidature.update({ statut_candidature: nouveauStatut });

  await creerHistoriqueModification({
    table_modifiee: 'Candidature',
    champ_modifie: 'statut_candidature',
    ancienne_valeur: ancienStatut,
    nouvelle_valeur: nouveauStatut,
    id_acteur: rhId,
    id_candidature: candidature.id
  });


    // Définition du message selon le statut
  let messageNotification = '';
  if (nouveauStatut === 'Acceptée') {
    messageNotification = `Votre candidature pour l'offre "${candidature.Offre.titre}" est maintenant acceptée. La période de stage sera proposée prochainement.`;
  } else if (nouveauStatut === 'Refusée') {
    messageNotification = `Votre candidature pour l'offre "${candidature.Offre.titre}" a été refusée.`;
  } else if (nouveauStatut === 'Présélectionnée') {
    messageNotification = `Votre candidature pour l'offre "${candidature.Offre.titre}" est maintenant présélectionnée. L'entretien sera planifié prochainement.`;
  } else if (nouveauStatut === 'Entretien planifié') {
    messageNotification = `Votre entretien pour l'offre "${candidature.Offre.titre}" a été planifié.`;
  } else {
    messageNotification = `Votre candidature pour l'offre "${candidature.Offre.titre}" est maintenant "${nouveauStatut}".`;
  }
  // Création de la notification
  await creerNotification({
    utilisateur_id: candidature.candidat_id,
    titre: `Candidature ${nouveauStatut}`,
    message: messageNotification ,
    type: "statut_candidature",
    lien_action: `mes-candidatures`,
    type_cible: "candidat",
    candidature_id: candidatureId
  });

  await sendCandidatureStatusEmail(
    candidature.Candidat.email,
    candidature.Candidat.prenom,
    candidature.Offre.titre,
    nouveauStatut
  );

  return candidature;
}

// Accepter une candidature
async function accepterCandidature(req, res) {
  try {
    const candidature = await Candidature.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Offre,
          attributes: ['entretien_requis', 'titre']
        },
        {
          model: Entretien,
          required: false
        },
        {
          model: Utilisateur,
          as: 'Candidat',
          attributes: ['email', 'prenom']
        }
      ]
    });

    const verifEntretien = candidature.Offre.entretien_requis;

    await executerActionCandidature({
  candidatureId: req.params.id,
  rhId: req.user.userId,
  nouveauStatut: 'Acceptée',
  validationEntretien: candidature.Offre.entretien_requis
});


    // Mettre à jour l'entretien
    if (verifEntretien) {
      await Entretien.update(
        { 
          statut: 'Accepté',
          resultat: 'Retenu' 
        },
        { where: { candidature_id: req.params.id } }
      );

   
    }

    res.json({ 
      success: true,
      message: "Candidature acceptée avec succès"
    });

  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
}

// Refuser une candidature
async function refuserCandidature(req, res) {
  try {
    const candidature = await Candidature.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Offre,
          attributes: ['entretien_requis', 'titre']
        },
        {
          model: Entretien,
          required: false
        },
        {
          model: Utilisateur,
          as: 'Candidat',
          attributes: ['email', 'prenom']
        }
      ]
    });

    const verifEntretien = candidature.Offre.entretien_requis;

    await executerActionCandidature({
  candidatureId: req.params.id,
  rhId: req.user.userId,
  nouveauStatut: 'Refusée',
  validationEntretien: false // refuser même si entretien manquant
});


    // Mettre à jour l'entretien 
    if (verifEntretien) {
      await Entretien.update(
        { 
          statut: 'Refusé',
          resultat: 'Non retenu' 
        },
        { where: { candidature_id: req.params.id } }
      );

     
    }

    res.json({ 
      success: true,
      message: "Candidature refusée avec succès"
    });

  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
}

// Présélectionner une candidature
async function preselectionnerCandidature(req, res) {
  try {
    const candidature = await Candidature.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Offre,
          attributes: ['entretien_requis', 'titre'],
      
        },
        {
          model: Entretien,
          required: false
        },
        {
          model: Utilisateur,
          as: 'Candidat',
          attributes: ['email', 'prenom']
        }
      ]
    });


    // ✅ Vérification du statut actuel
    if (candidature.statut_candidature !== 'En cours d\'execution') {
      throw new Error("Seules les candidatures avec le statut 'En cours d'execution' peuvent être présélectionnées.");
    }

    if (candidature.Entretien && candidature.Entretien.statut !== 'Annulé') {
      throw new Error("Un entretien est déjà planifié pour cette candidature");
    }

    await executerActionCandidature({
      candidatureId: req.params.id,
      rhId: req.user.userId,
      nouveauStatut: 'Presélectionnée'
    });

    res.json({
      success: true,
      message: "Candidature présélectionnée avec succès"
    });

  } catch (error) {
  console.error("ERREUR DANS preselectionnerCandidature:", error);
  res.status(400).json({ error: error.message || error });
}
}

// 
function getRelativePath(absolutePath) {
  // Trouve la position du dossier "uploads" dans le chemin absolu
  const uploadsIndex = absolutePath.indexOf('uploads');
  if (uploadsIndex === -1) return null;

  // Retourne la sous-chaîne depuis 'uploads' (ex: 'uploads/candidatures/...')
  return absolutePath.substring(uploadsIndex).replace(/\\/g, '/'); 
  // replace pour transformer '\' en '/' pour URL friendly
}

module.exports = {
  postuler,
  getMesCandidatures,
  annulerCandidature,
  getCandidaturesPourOffre,
  accepterCandidature,
  refuserCandidature,
  preselectionnerCandidature,
  checkAlreadyApplied,
  
  
};