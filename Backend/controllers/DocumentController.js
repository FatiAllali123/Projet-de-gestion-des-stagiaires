const fs = require('fs');
const { sequelize } = require('../models');
const PDFDocument = require('pdfkit');
const path = require('path');
const { Document, TraitementDocument, Stage, Candidature, Offre, Utilisateur,PropositionDates } = require('../models');
const { creerNotification } = require('./NotificationController');
const { drawAttestation } = require('../services/attestationTemplate');
const { Absence } = require('../models');
const multer = require('multer');
const upload = require('../middlewares/upload_document').single('file');
const { Op } = require('sequelize');

// Utilitaire : Chemin relatif à partir du chemin absolu
const getRelativePath = (absolutePath) => {
  if (!absolutePath) return null;
  const normalizedPath = path.normalize(absolutePath).replace(/\\/g, '/');
  const index = normalizedPath.indexOf('/uploads/');
  return index !== -1 ? normalizedPath.substring(index + 1) : null;
};
// Utilitaire : Supprimer un fichier s’il existe
const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, err => err && console.error('Erreur suppression fichier:', err));
  }
};
// Obtenir le RH à partir du document
const getRhFromDocument = async (documentId) => {
  try {
    // 1. Récupérer le document avec sa candidature
    const document = await Document.findByPk(documentId, {
      include: [{
        model: Candidature,
        attributes: ['id', 'offre_id']
      }]
    });

    if (!document?.Candidature) {
      console.log('Aucune candidature associée au document');
      return null;
    }

    // 2. Récupérer l'offre associée à la candidature
    const offre = await Offre.findByPk(document.Candidature.offre_id, {
      attributes: ['id', 'rh_id'] // On récupère seulement l'ID du RH
    });

    if (!offre?.rh_id) {
      console.log('Aucun RH associé à cette offre');
      return null;
    }

    // 3. Vérifier que l'utilisateur est bien un RH
    const rh = await Utilisateur.findOne({
      where: {
        id: offre.rh_id,
        role: 'rh' // On vérifie le rôle
      },
      attributes: ['id', 'nom', 'prenom', 'email']
    });

    if (!rh) {
      console.log('L\'utilisateur RH n\'existe pas ou n\'a pas le bon rôle');
      return null;
    }

    return rh;
  } catch (error) {
    console.error('Erreur dans getRhFromDocument:', error);
    return null;
  }
};
//Obtenir l'encadrant depuis un document
const getEncadrantFromDocument = async (documentId) => {
  const document = await Document.findByPk(documentId, {
    include: {
      model: Stage,
      include: {
        model: Utilisateur,
        as: 'Encadrant',
        attributes: ['id', 'nom', 'prenom', 'email']
      }
    }
  });
  return document?.Stage?.Encadrant || null;
};

// Obtenir le stagiaire (candidat) depuis un document
const getCandidatFromDocument = async (documentId) => {
  const document = await Document.findByPk(documentId, {
    include: {
      model: Stage,
      include: {
        model: Utilisateur,
        as: 'Stagiaire',
        attributes: ['id', 'nom', 'prenom', 'email']
      }
    }
  });
  return document?.Stage?.Stagiaire || null;
};

const uploadDocument = async (req, res) => {
  try {
    const { type, stage_id, candidature_id, absence_id } = req.body;  // ajout candidature_id
    const file = req.file;

    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    const userId = req.user.userId;

    if (!file) {
      return res.status(400).json({ message: 'Aucun fichier reçu.' });
    }

    const absolutePath = file.path;
    const relativePath = getRelativePath(absolutePath);

    if (!relativePath) {
      deleteFile(absolutePath);
      return res.status(500).json({ message: 'Erreur lors de la génération du chemin relatif.' });
    }

    if (type === "justificatif d'absence" && !absence_id) {
      deleteFile(absolutePath);
      return res.status(400).json({ message: "Un justificatif d'absence doit être associé à une absence." });
    }

    if (type !== "justificatif d'absence" && absence_id) {
      deleteFile(absolutePath);
      return res.status(400).json({ message: "Le champ absence_id ne peut être utilisé que pour les justificatifs d'absence." });
    }

    if (type === "justificatif d'absence") {
      const absence = await Absence.findByPk(absence_id);
      if (!absence) {
        deleteFile(absolutePath);
        return res.status(404).json({ message: "L'absence spécifiée n'existe pas." });
      }
    }

    // Validation spécifique pour la convention à signer : on doit avoir candidature_id
    if (type === 'convention à signer' && !candidature_id) {
      deleteFile(absolutePath);
      return res.status(400).json({ message: "Une convention à signer doit être liée à une candidature." });
    }

    // Construction des données du document
    const documentData = {
      type,
      lien: relativePath,
      date_depot: new Date(),
      statut: 'déposé',
      absence_id: type === "justificatif d'absence" ? absence_id : null
    };
    
    // Pour les conventions à signer, on lie à la candidature
    if (type === 'convention à signer') {
      documentData.candidature_id = candidature_id;
      documentData.stage_id = null;  // pas lié au stage encore
    } else {
      // Pour les autres types (ex: convention signée), on lie au stage
      documentData.stage_id = stage_id || null;
      documentData.candidature_id = null;
    }

    // Création du document
    const document = await Document.create(documentData);

    // Enregistrer le traitement
    await TraitementDocument.create({
      action: 'déposé',
      date_traitement: new Date(),
      document_id: document.id,
      acteur_id: userId
    });

    // Gestion des notifications (inchangée)
    let cibleId = null;
    let titre = '';
    let message = '';
    let typeNotif = 'document';

    switch (type) {
      case 'convention à signer':

        const rh = await getRhFromDocument(document.id);
       
        if (rh) {
          
          cibleId = rh.id;
          titre = 'Convention à signer déposée';
          message = 'Une convention a été déposée et nécessite votre signature.';
          lien_action = `cnv2`;
           await creerNotification({
         utilisateur_id: cibleId,
          titre,
          message,
         type: typeNotif,
         lien_action,
         candidature_id,        
         document_id: document.id
    });
        }
        break;

    case 'convention signée':
  if (!req.body.candidature_id) {
    deleteFile(absolutePath);
    return res.status(400).json({ message: "La convention signée doit être associée à une candidature." });
  }

  // 1. Trouver la candidature associée
  const candidature = await Candidature.findByPk(req.body.candidature_id, {
    include: [
      {
        model: Offre,
        attributes: ['titre']
      },
      {
        model: PropositionDates,
                as: 'PropositionsDates', 
        where: { statut: 'acceptée' },
        required: false,
        order: [['date_proposition', 'DESC']],
        limit: 1
      },
      {
        model: Utilisateur,
        as: 'Candidat',
        attributes: ['id', 'email', 'prenom']
      }
    ]
  });

  if (!candidature) {
    deleteFile(absolutePath);
    return res.status(404).json({ message: "Candidature non trouvée pour cette convention." });
  }

  // 2. Vérifier qu'il n'y a pas déjà un stage
  const existingStage = await Stage.findOne({ where: { candidature_id: candidature.id } });
  if (existingStage) {
    deleteFile(absolutePath);
    return res.status(400).json({ message: "Un stage existe déjà pour cette candidature." });
  }

  // 3. Créer le stage
  const propositionAcceptee = candidature.PropositionsDates?.[0];
  if (!propositionAcceptee) {
  // Il n'y a pas de proposition acceptée, donc date_debut et date_fin restent undefined
  console.log("Aucune proposition de date disponible");
}
  const date_debut = propositionAcceptee.date_debut_proposee;
  const date_fin = propositionAcceptee.date_fin_proposee;

  const stage = await Stage.create({
    sujet_stage: candidature.Offre.titre,
    date_debut,
    date_fin,
    statut_stage: new Date(date_debut) > new Date() ? 'Planifié' : 'En cours',
    Stagiaire_id: candidature.candidat_id,
    candidature_id: candidature.id
  });

  // 4. Lier le document au stage créé
  await document.update({ stage_id: stage.id });
  // 6. Notifications
  const candidat = candidature.Candidat;
  if (candidat) {
    cibleId = candidat.id;
    titre = 'Stage créé';
    message = `Un stage a été créé pour vous : ${candidature.Offre.titre}`;
    typeNotif = 'stage';
    lien_action = `mes-stages`;

    await creerNotification({
      utilisateur_id: cibleId,
      titre,
      message,
      type: typeNotif,
      lien_action,
      stage_id: stage.id
    });
  }
  break;
      case 'justificatif d\'absence':
        const encadrant = await getEncadrantFromDocument(document.id);
        if (encadrant) {
          cibleId = encadrant.id;
          titre = 'Nouveau justificatif d\'absence';
          message = 'Un justificatif d\'absence a été soumis par le stagiaire.';
          lien_action = `mes-stages-encadrant`;
          await Absence.update(
            { is_justified: false },
            { where: { id: absence_id } }
          );
        }
        break;

      case 'rapport':
        const encadrantRapport = await getEncadrantFromDocument(document.id);
        if (encadrantRapport) {
          cibleId = encadrantRapport.id;
          titre = 'Nouveau rapport';
          message = 'Un rapport a été soumis par le stagiaire.';
          lien_action = `rapports`;
        }
        break;

      default:
        console.warn('Type de document inconnu pour notification');
        break;
    }

    if (cibleId && type!=='convention à signer') {
      await creerNotification({
        utilisateur_id: cibleId,
        titre,
        message,
        type: typeNotif,
        lien_action,
        stage_id,
        document_id: document.id
      });
    }

    return res.status(201).json({
      message: 'Document déposé avec succès.',
      document: {
        id: document.id,
        type: document.type,
        statut: document.statut,
        lien: document.lien,
        ...(type === "justificatif d'absence" && { absence_id: document.absence_id })
      }
    });

  } catch (error) {
    if (req.file?.path) deleteFile(req.file.path);
    console.error('Erreur upload document:', error);
    return res.status(500).json({
      message: 'Erreur serveur.',
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};





// Gestion de justifictif 
const traiterJustificatif = async (req, res) => {
  try {
        // Vérification cruciale de l'authentification
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ 
        success: false,
        message: "Utilisateur non authentifié" 
      });
    }
    const { document_id } = req.params;
    const { action, commentaire } = req.body; // 'accepter' ou 'refuser'
    const userId = req.user.userId;

    // 1. Vérifier que le document existe et est un justificatif d'absence
    const document = await Document.findByPk(document_id, {
      include: [{
        model: Absence,
        as: 'absence', 
        foreignKey: 'absence_id' 
      }]
    });

    if (!document || document.type !== "justificatif d'absence") {
      return res.status(404).json({ 
        success: false,
        message: "Justificatif d'absence non trouvé." 
      });
    }

    // 2. Vérifier que le document n'a pas déjà été traité
    if (document.statut !== 'déposé') {
      return res.status(400).json({
        success: false,
        message: "Ce justificatif a déjà été traité."
      });
    }

    // 3. Vérifier qu'une absence est bien associée
    if (!document.absence_id || !document.absence) {
      return res.status(400).json({
        success: false,
        message: "Ce justificatif n'est associé à aucune absence."
      });
    }

    // 4. Traitement selon l'action
    let newStatus, isJustified, notificationMessage;

    if (action === 'accepter') {
      newStatus = 'accepté';
      isJustified = true;
      notificationMessage = `Votre justificatif d'absence pour le ${document.absence.date_absence} a été accepté.`;
    } else if (action === 'refuser') {
      newStatus = 'refusé';
      isJustified = false;
       notificationMessage = `Votre justificatif d'absence pour le ${document.absence.date_absence} a été refusé.`;
    } else {
      return res.status(400).json({
        success: false,
        message: "Action invalide. Choisissez 'accepter' ou 'refuser'."
      });
    }

    // 5. Mettre à jour le document et l'absence associée
    await sequelize.transaction(async (t) => {
      // Mettre à jour le statut du document
      await document.update({
        statut: newStatus
      }, { transaction: t });

      // Mettre à jour l'absence associée
      await document.absence.update({
        is_justified: isJustified
      }, { transaction: t });

      // Enregistrer le traitement
      await TraitementDocument.create({
        action: newStatus,
        date_traitement: new Date(),
        document_id: document.id,
        acteur_id: userId,
        commentaire: commentaire || null
      }, { transaction: t });
    });

    // 6. Envoyer une notification au stagiaire
    const stagiaire = await getCandidatFromDocument(document.id);
    if (stagiaire) {
      await creerNotification({
        utilisateur_id: stagiaire.id,
        titre: `Justificatif d\'absence ${newStatus}`,
        message: notificationMessage,
        type: 'document',
        lien_action: `mes-stages`,
        stage_id: document.stage_id,
        document_id: document.id,
       
      });
    }

    res.status(200).json({
      success: true,
      message: "Justificatif ${newStatus} avec succès.",
      document: {
        id: document.id,
        statut: newStatus,
        type: document.type,
        absence_id: document.absence_id
      },
      absence: {
        id: document.absence.id,
        date_absence: document.absence.date_absence,
        is_justified: isJustified
      }
    });

  } catch (error) {
    console.error('Erreur traitement justificatif:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};
async function getJustificationAcceptee(req, res) {
  try {
    const { absence_id } = req.params;

    // 1. Vérifier que l'absence existe
    const absence = await Absence.findByPk(absence_id);
    if (!absence) {
      return res.status(404).json({
        success: false,
        message: "Absence non trouvée."
      });
    }

    // 2. Récupérer le justificatif accepté associé à cette absence
    const justificatif = await Document.findOne({
      where: { 
        absence_id: absence_id,
        type: "justificatif d'absence",
        statut: 'accepté'
      },
      attributes: ['id', 'lien', 'date_depot']
    });

    if (!justificatif) {
      return res.status(404).json({
        success: false,
        message: "Aucun justificatif accepté trouvé pour cette absence."
      });
    }

    // 3. Retourner les informations du justificatif
    res.status(200).json({
      success: true,
      justification: {
        id: justificatif.id,
        lien: justificatif.lien, // Chemin d'accès au fichier
        date_depot: justificatif.date_depot,
         statut:justificatif.statut, 
        isJustified: absence.is_justified // Pour confirmation
      }
    });

  } catch (error) {
    console.error(`Erreur getJustificationAcceptee: ${error.message}`);
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
//pour get histrique de traitement des ustificatifs d'une abscence
async function getHistoriqueTraitementForAbsence(req, res) {
  try {
    const { absence_id } = req.params;

    const justificatifs = await Document.findAll({
      where: { 
        absence_id: absence_id,
        type: "justificatif d'absence"
      },
      include: [{
        model: TraitementDocument,
        include: [{
          model: Utilisateur,
          attributes: ['id', 'nom', 'prenom']
        }],
        order: [['date_depot', 'DESC']]
      }],
      order: [['date_depot', 'DESC']] // Tri des justificatifs du plus récent au plus ancien
    });

    const result = justificatifs.map(doc => ({
      id: doc.id,
      lien: doc.lien,
      date_depot: doc.date_depot,
      statut: doc.statut,
      traitements: doc.TraitementDocuments.map(t => ({
        id: t.id,
        action: t.action,
        date_traitement: t.date_traitement,
        commentaire: t.commentaire,
        acteur: t.Utilisateur
      }))
    }));

    res.status(200).json({
      success: true,
      justificatifs: result
    });
  } catch (error) {
    console.error('Erreur getHistoriqueTraitementForAbsence:', error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
}
async function getJustificatifForAbsence(req, res) {
  try {
    const { absence_id } = req.params;

    const justificatif = await Document.findOne({
      where: { 
        absence_id: absence_id,
        type: "justificatif d'absence"
      },
      attributes: ['id', 'lien', 'date_depot', 'statut']
    });

    if (!justificatif) {
      return res.status(404).json({
        success: false,
        message: "Aucun justificatif trouvé pour cette absence."
      });
    }

    res.status(200).json({
      success: true,
      justification: justificatif
    });

  } catch (error) {
    console.error(`Erreur getJustificatifForAbsence: ${error.message}`);
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





// Conventions

const getConventionsASigner = async (req, res) => {
  try {
    const { stage_id } = req.params;

    // Récupérer le stage avec sa candidature
    const stage = await Stage.findByPk(stage_id);
    if (!stage) {
      return res.status(404).json({
        success: false,
        message: "Stage non trouvé."
      });
    }

    // Récupérer les conventions à signer liées à la candidature associée au stage
    const conventions = await Document.findAll({
      where: {
        candidature_id: stage.candidature_id,
        type: 'convention à signer',
        statut: ['déposé', 'accepté', 'refusé']  // Inclure tous les statuts pertinents
      },
      include: [{
        model: TraitementDocument,
        as: 'TraitementDocuments',
        required: false,
        order: [['date_traitement', 'DESC']]
      }],
      order: [['date_depot', 'DESC']]
    });

    res.status(200).json({
      success: true,
      conventions
    });

  } catch (error) {
    console.error('Erreur récupération conventions à signer:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};

const getConventionSignee = async (req, res) => {
  try {
    const { stage_id } = req.params;
    
    const convention = await Document.findOne({
      where: { 
        stage_id,
        type: 'convention signée',
        statut: 'déposé'
      }
    });

    if (!convention) {
      return res.status(404).json({
        success: false,
        message: "Aucune convention signée trouvée"
      });
    }

    res.status(200).json({
      success: true,
      convention
    });
  } catch (error) {
    console.error('Erreur récupération convention signée:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};

const hasConventionSignee = async (req, res) => {
  try {
    const { stage_id } = req.params;
    
    const count = await Document.count({
      where: { 
        stage_id,
        type: 'convention signée',
        statut: 'déposé'
      }
    });

    res.status(200).json({
      success: true,
      hasSignedConvention: count > 0
    });
  } catch (error) {
    console.error('Erreur vérification convention signée:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};
const traiterConvention = async (req, res) => {
  try {
    const { document_id } = req.params;
    const { action, commentaire } = req.body;
    const userId = req.user.userId;

    // 1. Récupérer le document avec la candidature associée
    const document = await Document.findByPk(document_id, {
      include: [{
        model: Candidature,
        include: [{
          model: Stage,
          include: [{
            model: Document,
            where: { type: 'convention signée' },
            required: false
          }]
        }]
      }]
    });

    if (!document) {
      return res.status(404).json({ 
        success: false,
        message: "Document non trouvé." 
      });
    }

    // 2. Vérification spécifique pour l'action "valider"
    if (action === 'valider' && document.type === 'convention à signer') {
      // Vérifier si le stage associé a une convention signée
      const hasSignedConvention = document.Candidature?.Stage?.Documents?.some(
        doc => doc.type === 'convention signée'
      );

      if (!hasSignedConvention) {
        return res.status(400).json({
          success: false,
          message: "Impossible de valider - La convention signée n'a pas été déposée pour ce stage.",
          code: 'MISSING_SIGNED_CONVENTION'
        });
      }
    }

    // 3. Définir le nouveau statut
    let newStatus;
    if (action === 'valider') {
      newStatus = 'accepté';
    } else if (action === 'refuser') {
      newStatus = 'refusé';
    } else {
      return res.status(400).json({
        success: false,
        message: "Action invalide."
      });
    }

    // 4. Mettre à jour le statut
    await document.update({ 
      statut: newStatus
    });

    // 5. Enregistrer le traitement
    const traitement = await TraitementDocument.create({
      action: newStatus,
      date_traitement: new Date(),
      document_id: document.id,
      acteur_id: userId,
      commentaire: commentaire || null
    });

    res.status(200).json({
      success: true,
      message: `Convention ${newStatus} avec succès.`,
      document: {
        ...document.toJSON(),
        TraitementDocuments: [traitement]
      }
    });

  } catch (error) {
    console.error('Erreur traitement convention:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};
const getConventionsTraitees = async (req, res) => {
  try {
    const { stage_id } = req.params;

    // Récupérer le stage avec sa candidature associée
    const stage = await Stage.findByPk(stage_id);
    if (!stage) {
      return res.status(404).json({
        success: false,
        message: "Stage non trouvé."
      });
    }

    // Chercher les conventions à signer traitées (acceptées ou refusées) liées à la candidature
    const conventions = await Document.findAll({
      where: {
        candidature_id: stage.candidature_id,
        type: 'convention à signer',
        statut: ['accepté', 'refusé']
      },
      include: [{
        model: TraitementDocument,
        as: 'TraitementDocuments',
        required: true,
        order: [['date_traitement', 'DESC']]
      }],
      order: [['date_depot', 'DESC']]
    });

    res.status(200).json({
      success: true,
      conventions,
    });

  } catch (error) {
    console.error('Erreur récupération conventions traitées:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};
const getAllConventions = async (req, res) => {
  try {
    const { stage_id } = req.params;

    // Récupérer le stage avec sa candidature
    const stage = await Stage.findByPk(stage_id);
    if (!stage) {
      return res.status(404).json({
        success: false,
        message: 'Stage non trouvé.'
      });
    }

    // Récupérer les conventions liées au stage (signées)
    // ET les conventions à signer liées à la candidature associée
    const conventions = await Document.findAll({
      where: {
        [Op.or]: [
          { 
            stage_id: stage.id,
            type: 'convention signée'
          },
          { 
            candidature_id: stage.candidature_id,
            type: 'convention à signer'
          }
        ]
      },
      include: [{
        model: TraitementDocument,
        as: 'TraitementDocuments',
        required: false,
        order: [['date_traitement', 'DESC']]
      }],
      order: [['date_depot', 'DESC']]
    });

    res.status(200).json({
      success: true,
      conventions
    });
  } catch (error) {
    console.error('Erreur récupération conventions:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};
// méthode pour récupérer les conventosn a signer qui sont traites ou pas encore à partir de candidature uniquement 
const getConventionsASignerByCandidature = async (req, res) => {
  try {
    const { candidature_id } = req.params;

    const conventions = await Document.findAll({
      where: { 
        candidature_id,
        type: 'convention à signer',
        statut: ['déposé', 'accepté', 'refusé']
      },
      include: [{
        model: TraitementDocument,
        as: 'TraitementDocuments',
        required: false,
        order: [['date_traitement', 'DESC']]
      }],
      order: [['date_depot', 'DESC']]
    });

    res.status(200).json({
      success: true,
      conventions
    });
  } catch (error) {
    console.error('Erreur récupération conventions à signer (par candidature):', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};
// get 
const getConventionsASignerNonTraitees = async (req, res) => {
  try {
    const { stage_id } = req.params;

    const conventions = await Document.findAll({
      where: { 
        stage_id,
        type: 'convention à signer',
        statut: 'déposé' // uniquement non traitées
      },
      include: [{
        model: TraitementDocument,
        as: 'TraitementDocuments',
        required: false,
        order: [['date_traitement', 'DESC']]
      }],
      order: [['date_depot', 'DESC']]
    });

    res.status(200).json({
      success: true,
      conventions
    });
  } catch (error) {
    console.error('Erreur récupération conventions déposées non traitées:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};
const getConventionsTraiteesByCandidature = async (req, res) => {
  try {
    const { candidature_id } = req.params;

    const conventions = await Document.findAll({
      where: {
        candidature_id,
        type: 'convention à signer',
        statut: ['accepté', 'refusé'] // conventions traitées
      },
      include: [{
        model: TraitementDocument,
        as: 'TraitementDocuments',
        required: true,
        order: [['date_traitement', 'DESC']]
      }],
      order: [['date_depot', 'DESC']]
    });

    res.status(200).json({
      success: true,
      conventions,
    });

  } catch (error) {
    console.error('Erreur récupération conventions traitées par candidature:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};
const getConventionsSigneesByCandidat = async (req, res) => {
  try {
    const { candidatId } = req.params;

    const conventions = await Document.findAll({
      where: { type: 'convention signée' },
      include: [
        {
          model: Stage,
          required: true,
          include: [
            {
              model: Candidature,
              required: true,
              where: { candidat_id: candidatId }
            }
          ]
        },
        {
          model: TraitementDocument,
          as: 'TraitementDocuments',
          required: false
        }
      ],
      order: [
        ['date_depot', 'DESC'],
        [{ model: TraitementDocument, as: 'TraitementDocuments' }, 'date_traitement', 'DESC']
      ]
    });

    res.status(200).json({
      success: true,
      conventions
    });
  } catch (error) {
    console.error('Erreur récupération conventions signées:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};
// Pour le RH - Conventions à signer
const getConventionsASignerRH = async (req, res) => {
  try {
    const conventions = await Document.findAll({
      where: { 
        type: 'convention à signer',
        statut: 'déposé'
      },
      include: [
        {
          model: Candidature,
          include: [
            {
              model: Utilisateur,
              as: 'Candidat',
              attributes: ['id', 'nom', 'prenom', 'email']
            },
            {
              model: Offre,
              attributes: ['id', 'titre']
            }
          ]
        },
        {
          model: TraitementDocument,
          as: 'TraitementDocuments',
          required: false,
          order: [['date_traitement', 'DESC']]
        }
      ],
      order: [['date_depot', 'DESC']]
    });

    res.status(200).json({
      success: true,
      conventions
    });
  } catch (error) {
    console.error('Erreur récupération conventions RH:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};
// Pour le RH - Conventions signées
const getConventionsSigneesRH = async (req, res) => {
  try {
    const conventions = await Document.findAll({
      where: { 
        type: 'convention signée'
      },
      include: [
        {
          model: Stage,
          include: [
             {
              model: Utilisateur,
              as: 'Stagiaire', 
              attributes: ['id', 'nom', 'prenom', 'email']
            },
            {
              
              model: Candidature,
              include: [
                {
                  model: Utilisateur,
                  as: 'Candidat',
                  attributes: ['id', 'nom', 'prenom', 'email']
                },
                {
                  model: Offre,
                  attributes: ['id', 'titre']
                }
              ]
            }
          ]
        },
        {
          model: TraitementDocument,
          as: 'TraitementDocuments',
          required: false,
          order: [['date_traitement', 'DESC']]
        }
      ],
      order: [['date_depot', 'DESC']]
    });

    res.status(200).json({
      success: true,
      conventions
    });
  } catch (error) {
    console.error('Erreur récupération conventions signées RH:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};
// Récupérer les candidatures en attente de convention (pour la section "Envoyer")
const getCandidaturesAttenteConvention = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Solution en 2 requêtes pour éviter les problèmes d'association
    // 1. Récupérer les IDs des candidatures avec conventions existantes
    const conventionsExistantes = await Document.findAll({
      where: {
        type: 'convention à signer',
        statut: ['déposé', 'accepté']
      },
      attributes: ['candidature_id'],
      group: ['candidature_id']
    });
    const idsAvecConvention = conventionsExistantes.map(d => d.candidature_id);

    // 2. Récupérer les candidatures éligibles
    const candidatures = await Candidature.findAll({
      where: {
        statut_candidature: 'Acceptée',
        id: {
          [Op.notIn]: idsAvecConvention
        }
      },
      include: [
        {
          model: Stage,
          required: false
        },
        {
          model: PropositionDates,
          as: 'PropositionsDates',
          where: {
            statut: 'acceptée',
            date_debut_proposee: { [Op.gt]: today }
          },
          required: true
        },
        {
          model: Offre,
          attributes: ['id', 'titre', 'description']
        },
        {
          model: Utilisateur,
          as: 'Candidat',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ]
    });

    // Filtrer celles sans stage
    const candidaturesFiltrees = candidatures.filter(c => !c.Stage);

    res.status(200).json({
      success: true,
      candidatures: candidaturesFiltrees
    });
  } catch (error) {
    console.error('Erreur récupération candidatures en attente:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};

// Récupérer toutes les conventions (signées et à signer) pour un candidat
const getConventionsCandidat = async (req, res) => {
  try {
    const candidat_id = req.user.userId;

    // 1. Récupérer toutes les candidatures du candidat
    const candidatures = await Candidature.findAll({
      where: { candidat_id },
      attributes: ['id']
    });

    const candidatureIds = candidatures.map(c => c.id);

    // 2. Récupérer les stages du candidat (pour les conventions signées)
    const stages = await Stage.findAll({
      where: { candidature_id: candidatureIds },
      attributes: ['id', 'candidature_id']
    });

    const stageIds = stages.map(s => s.id);
    const stageCandidatureMap = stages.reduce((map, stage) => {
      map[stage.candidature_id] = stage.id;
      return map;
    }, {});

    // 3. Récupérer toutes les conventions
    const conventions = await Document.findAll({
      where: {
        [Op.or]: [
          { 
            candidature_id: candidatureIds,
            type: 'convention à signer'
          },
          {
            stage_id: stageIds,
            type: 'convention signée'
          }
        ]
      },
      include: [
        {
          model: TraitementDocument,
          as: 'TraitementDocuments',
          required: false,
          order: [['date_traitement', 'DESC']]
        }
      ],
      order: [['date_depot', 'DESC']]
    });

    // Ajouter des informations supplémentaires aux conventions
    const enhancedConventions = conventions.map(conv => {
      const enhanced = conv.toJSON();
      enhanced.estSignee = conv.type === 'convention signée';
      enhanced.estEnvoyee = conv.type === 'convention à signer';
      enhanced.stage_id = conv.type === 'convention signée' 
        ? conv.stage_id 
        : stageCandidatureMap[conv.candidature_id] || null;
      return enhanced;
    });

    res.status(200).json({
      success: true,
      conventions: enhancedConventions
    });
  } catch (error) {
    console.error('Erreur récupération conventions candidat:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};














// Gst rapport 
const getRapportsByStage = async (req, res) => {
  try {
    const { stage_id } = req.params;
    
    const rapports = await Document.findAll({
      where: { 
        stage_id,
        type: 'rapport'
      },
      include: [{
        model: TraitementDocument,
        include: [Utilisateur]
      }]
    });

    res.status(200).json({
      success: true,
      rapports
    });
  } catch (error) {
    console.error('Erreur récupération rapports:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};
const getRapportValide = async (req, res) => {
  try {
    const { stage_id } = req.params;
    
    const rapport = await Document.findOne({
      where: { 
        stage_id,
        type: 'rapport',
        statut: 'accepté'
      },
      include: [{
        model: TraitementDocument,
        include: [Utilisateur]
      }]
    });

    if (!rapport) {
      return res.status(404).json({
        success: false,
        message: "Aucun rapport validé trouvé"
      });
    }

    // Trouver le traitement avec action "accepté"
    const traitement_valide = rapport.TraitementDocuments.find(td => td.action === 'accepté');

    res.status(200).json({
      success: true,
      rapport: {
        ...rapport.toJSON(),
        traitement_valide  // ← ajouté ici
      }
    });
  } catch (error) {
    console.error('Erreur récupération rapport validé:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};
const hasRapportValide = async (req, res) => {
  try {
    const { stage_id } = req.params;
    
    const count = await Document.count({
      where: { 
        stage_id,
        type: 'rapport',
        statut: 'accepté'
      }
    });

    res.status(200).json({
      success: true,
      hasValidRapport: count > 0
    });
  } catch (error) {
    console.error('Erreur vérification rapport validé:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};
const traiterRapport = async (req, res) => {
  try {
    const { document_id } = req.params;
    const { action, commentaire } = req.body; // 'accepter' ou 'refuser'
    const userId = req.user.userId;

    // Vérifier que le document existe et est un rapport
    const document = await Document.findByPk(document_id);
   
    if (!document || document.type !== 'rapport') {
      return res.status(404).json({ 
        success: false,
        message: `Rapport non trouvé.`
      });
    }
   console.log(document.id);
    // Vérifier le statut actuel
    if (document.statut !== 'déposé') {
      return res.status(400).json({
        success: false,
        message: "Ce rapport a déjà été traité."
      });
    }

    // Déterminer le nouveau statut
    let newStatus, notificationMessage;
    if (action === 'accepter') {
      newStatus = 'accepté';
      notificationMessage = "Votre rapport a été accepté.";
    } else if (action === 'refuser') {
      newStatus = 'refusé';
      notificationMessage = "Votre rapport a été refusé.";
    } else {
      return res.status(400).json({
        success: false,
        message: "Action invalide. Choisissez 'accepter' ou 'refuser'."
      });
    }

    // Mettre à jour le document
    await document.update({ statut: newStatus });

    // Enregistrer le traitement
    await TraitementDocument.create({
      action: newStatus,
      date_traitement: new Date(),
      document_id: document.id,
      acteur_id: userId,
      commentaire: commentaire || null
    });

    // Envoyer notification au stagiaire
    const stagiaire = await getCandidatFromDocument(document.id);
    if (stagiaire) {
      await creerNotification({
        utilisateur_id: stagiaire.id,
        titre: `Rapport ${newStatus}`,
        message: notificationMessage,
        type: 'document',
        lien_action: `mes-stages`,
        stage_id: document.stage_id,
        document_id: document.id
      });
    }

    res.status(200).json({
      success: true,
      message: `Rapport ${newStatus} avec succès.`,
      document: {
        id: document.id,
        statut: newStatus,
        type: document.type,
        stage_id: document.stage_id
      }
    });

  } catch (error) {
    console.error('Erreur traitement rapport:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};
// Récupère tous les rapports non traités pour un encadrant
const getUntreatedReports = async (req, res) => {
  try {
    const encadrantId = req.params.encadrantId;
    console.log("encadrant conn : ",encadrantId);
    
    const rapports = await Document.findAll({
      where: {
        type: 'rapport',
        statut: 'déposé'
      },
      include: [{
        model: Stage,
        where: { encadrant_id: encadrantId },
        include: [{
          model: Utilisateur,
          as: 'Stagiaire'
        }]
      }, {
        model: TraitementDocument
      }]
    });

    res.json({ rapports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des rapports' });
  }
};








// Gst Attestation
// Vérifier si une attestation existe pour un stage
const hasAttestationStage = async (req, res) => {
  try {
    const { stage_id } = req.params;
    
    const count = await Document.count({
      where: { 
        stage_id,
        type: 'attestation stage'
      }
    });

    res.status(200).json({
      success: true,
      hasAttestation: count > 0
    });
  } catch (error) {
    console.error('Erreur vérification attestation:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};
// Récupérer l'attestation d'un stage
const getAttestationStage = async (req, res) => {
  try {
    const { stage_id } = req.params;
    
    const attestation = await Document.findOne({
      where: { 
        stage_id,
        type: 'attestation stage'
      }
    });

    if (!attestation) {
      return res.status(404).json({
        success: false,
        message: "Aucune attestation trouvée pour ce stage."
      });
    }

    res.status(200).json({
      success: true,
      attestation
    });
  } catch (error) {
    console.error('Erreur récupération attestation:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};

async function genererAttestation(req, res) {
  const { stage_id } = req.body;
  const userId = req.user.userId;

  try {
    // Récupérer le stage + stagiaire + encadrant
    const stage = await Stage.findByPk(stage_id, {
      include: [
        { model: Utilisateur, as: 'Stagiaire', attributes: ['id', 'nom', 'prenom'] },
        { model: Utilisateur, as: 'Encadrant', attributes: ['id', 'nom', 'prenom', 'specialite_encadrant'] },
        {
          model: Candidature,
          include: [{
            model: Offre,
            include: [{
              model: Utilisateur,
              attributes: ['id', 'nom', 'prenom']
            }]
          }]
        }
      ]
    });
    if (!stage) return res.status(404).json({ message: 'Stage non trouvé.' });



    // Vérifier l'existence d'un rapport valide (statut 'accepté') pour ce stage
    const rapportValide = await Document.findOne({
      where: { stage_id, type: 'rapport', statut: 'accepté' }
    });

    if (!rapportValide) {
      return res.status(400).json({ message: 'Impossible de générer l\'attestation : aucun rapport validé trouvé pour ce stage.' });
    }

    // Vérification attestation existante
    const exists = await Document.count({ where: { stage_id, type: 'attestation stage' } });
    if (exists) return res.status(400).json({ message: 'Attestation déjà générée.' });

    // Préparer le chemin
    const uploadDir = path.join(__dirname, '../uploads/attestation stage');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filename = `attestation_${stage_id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, filename);
    const relPath = getRelativePath(filePath);

    // Générer le PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const out = fs.createWriteStream(filePath);
    doc.pipe(out);

    // Mise en page via fonction externe
    drawAttestation(doc, {
      stagiaire: stage.Stagiaire,
      encadrant: stage.Encadrant,
      stage: stage,
      rh: stage.Candidature.Offre.Utilisateur // Accès au RH via les associations
    });

    doc.end();
    await new Promise(r => out.on('finish', r));

    // Sauvegarde base
    const document = await Document.create({
      type: 'attestation stage',
      lien: relPath,
      date_depot: new Date(),
      statut: 'généré',
      stage_id
    });
    await TraitementDocument.create({
      action: 'généré',
      date_traitement: new Date(),
      document_id: document.id,
      acteur_id: userId
    });

    // Notification stagiaire
    await creerNotification({
      utilisateur_id: stage.Stagiaire.id,
      titre: 'Attestation disponible',
      message: 'Votre attestation de stage est prête.',
      type: 'document',
      lien_action: `mes-stages`,
      stage_id,
      document_id: document.id
    });

    res.status(201).json({
      message: 'Attestation générée.',
      document: { id: document.id, lien: relPath }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
}








module.exports = {
  uploadDocument,
  traiterJustificatif,
  getJustificationAcceptee,
  getRapportsByStage,
  getRapportValide, 
  hasRapportValide ,
  traiterRapport, 
  getConventionsASigner, 
  getConventionSignee, 
  hasConventionSignee ,
  traiterConvention, 
  hasAttestationStage,
  getAttestationStage,
  genererAttestation,
  getJustificatifForAbsence,
  getHistoriqueTraitementForAbsence,
  getConventionsTraitees,
  getAllConventions,
  getConventionsASignerByCandidature,
  getConventionsASignerNonTraitees,
  getConventionsTraiteesByCandidature,
  getConventionsCandidat,
  getCandidaturesAttenteConvention,
  getConventionsSigneesByCandidat,
  getConventionsSigneesRH,
  getConventionsASignerRH,
  getUntreatedReports
};


