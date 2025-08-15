const { PropositionDates, Candidature, Stage, Utilisateur,Offre } = require('../models');
const { creerNotification } = require('./NotificationController');
const EmailService = require('../services/EmailService'); // adapte le chemin
const { Op } = require('sequelize');

// Proposer une période de stage (par RH)
const proposerPeriode = async (req, res) => {
  try {
    const { candidature_id, date_debut_proposee, date_fin_proposee, commentaire } = req.body;
   const dateDebut = new Date(date_debut_proposee);
const dateFin = new Date(date_fin_proposee);

if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime())) {
  return res.status(400).json({ message: "Les dates proposées sont invalides." });
}
    // Charger candidature avec candidat et offre
    const candidature = await Candidature.findByPk(candidature_id, {
      include: [
        { model: Utilisateur, as: 'Candidat' },
        { model: Offre }
      ]
    });

    if (!candidature || candidature.statut_candidature !== 'Acceptée') {
      return res.status(400).json({ message: "Candidature invalide ou non acceptée" });
    }

    const candidatId = candidature.candidat_id;

    // 1. Vérifier qu'il n'y a pas déjà une proposition acceptée pour cette candidature
    const propositionAcceptee = await PropositionDates.findOne({
      where: {
        candidature_id,
        statut: 'acceptée'
      }
    });
    if (propositionAcceptee) {
      return res.status(400).json({ message: "Une période acceptée existe déjà pour cette candidature." });
    }

    // 2. Vérifier conflit avec stages existants du candidat
    const hasConflict = await Stage.findOne({
      where: {
        Stagiaire_id: candidatId,
        [Op.or]: [
          {
            date_debut: { [Op.lte]: date_fin_proposee },
            date_fin: { [Op.gte]: date_debut_proposee }
          },
          {
            date_debut: { [Op.gte]: date_debut_proposee },
            date_fin: { [Op.lte]: date_fin_proposee }
          }
        ],
        statut_stage: {
          [Op.or]: ['En cours', 'Planifié']
        }
      },
      attributes: ['id']
    });

    if (hasConflict) {
      return res.status(400).json({ 
        message: "Ce candidat a déjà un stage planifié ou en cours pendant cette période." 
      });
    }

    // Si ok, créer la proposition
    const proposition = await PropositionDates.create({
      candidature_id,
      date_debut_proposee,
      date_fin_proposee,
      statut: 'en attente',
      commentaire: commentaire || null,
      date_proposition: new Date()
    });

    // Notifications internes et email
    await creerNotification({
      utilisateur_id: candidature.Candidat.id,
      titre: 'Nouvelle proposition de période de stage',
      message: `Une nouvelle période de stage vous a été proposée du ${date_debut_proposee} au ${date_fin_proposee}. Veuillez valider ou refuser.`,
      type: 'proposition_stage',
      candidature_id,
      lien_action: `/candidatures/${candidature_id}/propositions`

    });

    await EmailService.sendCandidatureStatusEmail(
      candidature.Candidat.email,
      candidature.Candidat.prenom,
      candidature.Offre?.titre || "offre",
      `Proposition de période de stage du ${date_debut_proposee} au ${date_fin_proposee}`
    );

    return res.status(201).json({ message: "Période proposée avec succès", proposition });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

const traiterPeriode = async (req, res) => {
  try {
    const { proposition_id } = req.params;
    const { action, commentaire } = req.body;

    const proposition = await PropositionDates.findByPk(proposition_id, {
      include: [
        { 
          model: Candidature, 
          as : 'Candidature',
          include: [
            { model: Utilisateur, as: 'Candidat' },
            { model: Offre, include: [{ model: Utilisateur}] }
          ] 
        }
      ]
    });

    if (!proposition || proposition.statut !== 'en attente') {
      return res.status(400).json({ message: "Proposition non trouvée ou déjà traitée" });
    }

    const candidature = proposition.Candidature;
    const candidat = candidature.Candidat;
    const offre = candidature.Offre;
    const rh = offre?.RH;

    const dateTraitement = new Date(); // On fixe la date de traitement ici

    if (action === 'accepter') {
      await proposition.update({ 
        statut: 'acceptée', 
        commentaire: commentaire || null, 
        date_traitement: dateTraitement
      });

      if (rh) {
        await creerNotification({
          utilisateur_id: rh.id,
          titre: 'Période de stage acceptée',
          message: `Le candidat ${candidat.prenom} ${candidat.nom || ''} a accepté la période proposée pour l'offre "${offre.titre}".`,
          type: 'validation_stage',
          offre_id: offre.id,
          candidature_id: candidature.id,
          lien_action: `/candidatures/${candidature.id}/propositions`
        });
      }

      await creerNotification({
        utilisateur_id: candidat.id,
        titre: 'Période de stage acceptée',
        message: `Vous avez accepté la période proposée pour votre stage du ${proposition.date_debut_proposee} au ${proposition.date_fin_proposee}. Maintenant vous pouvez déposer la convention de stage à signer.`,
        type: 'validation_stage',
        candidature_id: candidature.id,
        lien_action: `/candidatures/${candidature.id}/propositions`
      });

      await EmailService.sendCandidatureStatusEmail(
        candidat.email,
        candidat.prenom,
        offre.titre,
        `Vous avez accepté la période proposée pour votre stage du ${proposition.date_debut_proposee} au ${proposition.date_fin_proposee} pour l'offre ${offre.titre}. Maintenant vous pouvez déposer la convention de stage à signer.`
      );

      return res.status(200).json({ message: "Proposition acceptée et notifications envoyées", proposition });

    } else if (action === 'refuser') {
      await proposition.update({ 
        statut: 'refusée', 
        commentaire: commentaire || null, 
        date_traitement: dateTraitement
      });

      if (rh) {
        await creerNotification({
          utilisateur_id: rh.id,
          titre: 'Période de stage refusée',
          message: `Le candidat ${candidat.prenom} ${candidat.nom || ''} a refusé la période proposée pour l'offre "${offre.titre}".`,
          type: 'refus_stage',
          offre_id: offre.id,
          candidature_id: candidature.id
        });
      }

      return res.status(200).json({ message: "Proposition refusée et notifications envoyées", proposition });

    } else {
      return res.status(400).json({ message: "Action invalide" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Récupérer les propositions de période pour une candidature
const getPropositionsByCandidature = async (req, res) => {
  try {
    const { candidature_id } = req.params;

    const propositions = await PropositionDates.findAll({
      where: { candidature_id },
      attributes: [
        'id',
        'date_debut_proposee',
        'date_fin_proposee',
        'statut',
        'commentaire',
        'date_proposition',
        'date_traitement'
      ],
      order: [['date_proposition', 'DESC']]
    });

    return res.status(200).json(propositions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Récupérer les propositions  traitées pour une candidature
const getPropositionsNonTraitees = async (req, res) => {
  try {
    const { candidature_id } = req.params; // Changé de candidat_id à candidature_id

    const propositions = await PropositionDates.findAll({
      where: {
        candidature_id,
        statut: 'en attente'
      },
      include: [
        {
          model: Candidature,
          include: [
            { model: Offre, attributes: ['titre'] },
            { model: Utilisateur, as: 'Candidat', attributes: ['id', 'prenom', 'nom'] }
          ]
        }
      ],
      order: [['date_proposition', 'DESC']]
    });

    return res.status(200).json(propositions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Récupérer les propositions non traitées pour une candidature
const getPropositionsTraitees = async (req, res) => {
  try {
    const { candidature_id } = req.params; // Changé de candidat_id à candidature_id

    const propositions = await PropositionDates.findAll({
      where: {
        candidature_id,
        statut: 'acceptée'|| 'refusée'
      },
      include: [
        {
          model: Candidature,
          include: [
            { model: Offre, attributes: ['titre'] },
            { model: Utilisateur, as: 'Candidat', attributes: ['id', 'prenom', 'nom'] }
          ]
        }
      ],
      order: [['date_proposition', 'DESC']]
    });

    return res.status(200).json(propositions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
module.exports = {proposerPeriode , traiterPeriode,getPropositionsByCandidature,getPropositionsNonTraitees , getPropositionsTraitees }