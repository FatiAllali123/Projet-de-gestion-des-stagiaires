const { Offre, Candidature} = require('../models');
const { creerNotification } = require('./NotificationController');
const { creerHistoriqueModification } = require('./HistoriqueModificationController');
const { Op } = require('sequelize');
module.exports = {
  // Fonction pour créer une nouvelle offre
  async createOffre(req, res) {
    const { titre, description, competences_requises, duree, mode_stage, type_stage, entretien_requis, dateDebutApprox } = req.body;
    const rh_id = req.user.userId; // ID de l'utilisateur RH qui crée l'offre

    try {
      const nouvelleOffre = await Offre.create({
        titre,
        description,
        competences_requises,
        duree,
        mode_stage,
        type_stage,
        entretien_requis,
        dateDebutApprox,
        rh_id,
       
      });

      res.status(201).json({ message: "Offre créée avec succès", offre: nouvelleOffre });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la création de l'offre" });
    }
  },

  // Fonction pour mettre à jour une offre
  async updateOffre(req, res) {
    
    const offreId = req.params.id;
    const rh_id = req.user.userId;
    const nouvellesDonnees = req.body;

    try {
      const offre = await Offre.findByPk(offreId);
      if (!offre) return res.status(404).json({ message: "Offre introuvable" });

      // Vérifier que l'offre appartient bien au RH connecté
      if (offre.rh_id !== rh_id) {
        return res.status(403).json({ message: "Non autorisé" });
      }

      // Récupérer les anciennes valeurs
      const anciennesValeurs = offre.get({ plain: true });

      // Vérifier s'il y a des candidatures acceptées
      const candidatures = await Candidature.findAll({ where: { offre_id: offreId } });
      const hasAccepted = candidatures.some(c => c.statut_candidature === 'Acceptée');

      if (hasAccepted) {
        return res.status(400).json({ message: "Impossible de modifier une offre avec des candidatures acceptées." });
      }

      // Liste des champs modifiés
      const champsModifies = Object.keys(nouvellesDonnees).filter(
        key => nouvellesDonnees[key] !== anciennesValeurs[key]
      );

      // Historiser chaque champ modifié
      for (const champ of champsModifies) {
        await creerHistoriqueModification({
          table_modifiee: 'Offre',
          id_offre: offreId,
          champ_modifie: champ,
          ancienne_valeur: String(anciennesValeurs[champ]),
          nouvelle_valeur: String(nouvellesDonnees[champ]),
          id_acteur: rh_id
        });
      }

      // Modifier l'offre
      await offre.update(nouvellesDonnees);

      // Si des candidatures existent, notifier les candidats
      if (candidatures.length > 0) {
        const message = `L'offre "${offre.titre}" à laquelle vous avez postulé a été modifiée.`;
        
        for (const candidature of candidatures) {
          await creerNotification({
            utilisateur_id: candidature.candidat_id,
            titre: "Offre modifiée",
            message: message,
            type: "modification_offre",
            lien_action: `mes-candidatures`,
            offre_id: offreId
          });
        }
      }

      res.json({ 
        message: "Offre modifiée avec succès",
        modifications: champsModifies.length
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la modification de l'offre" });
    }
  },

  // Fonction pour récupérer toutes les offres
async getAllOffres(req, res) {
  try {
    const { statut, type, mode, dureeMin, dureeMax } = req.query;
    const whereClause = {};
    const includeClause = [];
    
    // Gestion des différents rôles
    switch (req.user.role) {
      case 'candidat':
        whereClause.statut_offre = 'actif';
        break;
        
      case 'rh':
        whereClause.rh_id = req.user.userId;
        break;
        
      case 'admin':
        includeClause.push({
          model: Utilisateur,
          as: 'Rh',
          attributes: ['id', 'nom', 'prenom', 'email']
        });
        break;
    }

    // Filtre par statut
    if (statut && ['actif', 'inactif'].includes(statut)) {
      whereClause.statut_offre = statut;
    }

    // Filtre par type de stage
    if (type && ['PFE', 'PFA', 'Initiation','Observation'].includes(type)) {
      whereClause.type_stage = type;
    }

    // Filtre par mode de stage
    if (mode && ['présentiel', 'distanciel', 'Hybride'].includes(mode)) {
      whereClause.mode_stage = mode;
    }

  

    const offres = await Offre.findAll({ 
      where: whereClause,
      include: includeClause,
      order: [['created_at', 'DESC']] 
    });

    res.json(offres);
  } catch (error) {
    console.error('Erreur lors de la récupération des offres:', error);
    res.status(500).json({ 
      error: "Erreur lors de la récupération des offres",
      details: error.message 
    });
  }
},

async getAllActiveOffres(req, res) {
  try {
    const offres = await Offre.findAll({ 
      where: { statut_offre: 'actif' },
      order: [['created_at', 'DESC']]
    });
    res.json(offres);
  } catch (error) {
    console.error('Erreur lors de la récupération des offres actives:', error);
    res.status(500).json({ 
      error: "Erreur lors de la récupération des offres actives",
      details: error.message 
    });
  }
},
  
async toggleOffreStatus(req, res) {
  const { id } = req.params;
  const { action } = req.body; // 'activate' ou 'deactivate'
  const rh_id = req.user.userId;

  try {
    const offre = await Offre.findByPk(id);
    if (!offre) {
      return res.status(404).json({ message: "Offre non trouvée" });
    }

    // Vérification que le RH est bien propriétaire de l'offre
    if (offre.rh_id !== rh_id) {
      return res.status(403).json({ message: "Non autorisé - Vous n'êtes pas le propriétaire de cette offre" });
    }

    const ancienStatut = offre.statut_offre;
    let nouveauStatut;

    switch (action) {
      case 'activate':
        nouveauStatut = 'actif';
        break;
      case 'deactivate':
        nouveauStatut = 'inactif';
        break;
      default:
        return res.status(400).json({ message: "Action non valide" });
    }

    // Historisation du changement
    await creerHistoriqueModification({
      table_modifiee: 'Offre',
      reference_id: id,
      champ_modifie: 'statut_offre',
      ancienne_valeur: ancienStatut,
      nouvelle_valeur: nouveauStatut,
      id_acteur: rh_id
    });

    // Mise à jour du statut
    await offre.update({ statut_offre: nouveauStatut });
    res.json({ 
      message: `Offre ${action === 'activate' ? 'activée' : 'désactivée'} avec succès`,
      nouveauStatut
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors du changement de statut" });
  }
},

async  filtrerOffres (req, res) {
  const { titre, competences, description, duree, mode_stage, type_stage, entretien_requis } = req.query;

  const whereClause = {
    statut_offre: 'actif'  // le candidat ne voit que les offres actives
  };

  if (titre) {
    whereClause.titre = { [Op.iLike]: `%${titre}%` };
  }

  if (competences) {
    whereClause.competences_requises = { [Op.iLike]: `%${competences}%` };
  }

  if (description) {
    whereClause.description = { [Op.iLike]: `%${description}%` };
  }

  if (duree) {
    whereClause.duree = duree;
  }

  if (mode_stage) {
    whereClause.mode_stage = mode_stage;
  }

  if (type_stage) {
    whereClause.type_stage = type_stage;
  }

  if (entretien_requis !== undefined) {
    whereClause.entretien_requis = entretien_requis === 'true'; // convertit "true"/"false" en booléen
  }

  try {
    const offres = await Offre.findAll({ where: whereClause });
    res.json(offres);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du filtrage des offres", error });
  }
},

async deleteOffre(req, res) {
  const offreId = req.params.id;

  try {


    const offre = await Offre.findByPk(offreId);

    if (!offre) {
      return res.status(404).json({ message: "Offre introuvable" });
    }

    // Vérifie s'il existe des candidatures liées
    const candidatures = await Candidature.findAll({ where: { offre_id: offreId } });

    if (candidatures.length > 0) {
      return res.status(400).json({ message: "Impossible de supprimer une offre avec des candidatures associées." });
    }

    await offre.destroy();


    res.json({ message: "Offre supprimée avec succès" });

  } catch (error) {
    console.error("Erreur lors de la suppression de l'offre:", error);
    res.status(500).json({ message: "Erreur serveur lors de la suppression" });
  }
}


};