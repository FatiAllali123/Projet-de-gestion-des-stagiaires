const { Utilisateur , Stage } = require('../models'); // importer le modèle Utilisateur
const bcrypt = require('bcrypt');// pour le hachage des mots de passe
const { sendWelcomeEmail ,sendAccountStatusEmail} = require('../services/EmailService');
const { creerHistoriqueModification  } = require('./HistoriqueModificationController');

const { Sequelize, Op } = require('sequelize');
module.exports = {
  // CREATE
  async createUser(req, res) {
    try {
      const hashedPassword = await bcrypt.hash(req.body.mot_de_pass, 10); 
      const user = await Utilisateur.create({
        ...req.body,
        mot_de_pass: hashedPassword
      });
      
      // Ne pas renvoyer le mot de passe
      const userData = user.toJSON();
      delete userData.mot_de_pass;
      
      res.status(201).json(userData);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  // READ ALL
  async getAllUsers(req, res) {
    try {
      const users = await Utilisateur.findAll({
        attributes: { exclude: ['mot_de_pass'] } // Exclure le mot de passe des résultats
      });
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message }); // 500 pour les erreurs serveur
    }
  },
  // READ ONE
  async getUserById(req, res) {
    try {
      const user = await Utilisateur.findByPk(req.params.id, {
        attributes: { exclude: ['mot_de_pass'] }
      });
      if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  // UPDATE
async updateUser(req, res) {
  try {
    const user = await Utilisateur.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Récupérer les données actuelles
    const currentData = user.get({ plain: true });
    
    // Préparer les données de mise à jour
    const updateData = {
      ...req.body,
      // Garder la spécialité existante si non fournie et rôle encadrant
      specialite_encadrant: req.body.role === 'encadrant' 
        ? req.body.specialite_encadrant || currentData.specialite_encadrant
        : null
    };

    // Validation supplémentaire pour les encadrants
    if (updateData.role === 'encadrant') {
      if (!updateData.specialite_encadrant) {
        return res.status(400).json({ error: "Spécialité requise pour les encadrants" });
      }
    }

    const [updated] = await Utilisateur.update(updateData, { 
      where: { id: req.params.id } 
    });

    if (updated) {
      const updatedUser = await Utilisateur.findByPk(req.params.id, {
        attributes: { exclude: ['mot_de_pass'] }
      });
      return res.status(200).json(updatedUser);
    }
    
    throw new Error('Aucune modification effectuée');

  } catch (error) {
    res.status(400).json({ 
      error: error.message,
      details: error.errors?.map(e => e.message) 
    });
  }
},
  // DELETE
  async deleteUser(req, res) {
    try {
      const deleted = await Utilisateur.destroy({
        where: { id: req.params.id }
      });
      if (deleted) return res.status(204).send();
      throw new Error('Utilisateur non trouvé');
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  , 
   // Création de comptes RH/Encadrants par l'admin
  async createStaffAccount(req, res) {
    try {
      // Vérifier que l'utilisateur est admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Accès réservé aux admins" ,type: "business"});
      }

      const { email, nom, prenom, role , specialite  } = req.body;

        // Vérifier d'abord si l'email existe déjà
        const existingUser = await Utilisateur.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ 
                error: "Cet email est déjà utilisé par un autre membre du personnel",
                type: "business"
            });
        }
        
  // Validation spéciale pour les encadrants
    if (role === 'encadrant' && !specialite) {
      return res.status(400).json({ error: "La spécialité est requise pour les encadrants" ,type: "business"});
    }
      // Générer un mot de passe temporaire
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Utiliser la méthode CRUD existante via le modèle
      const user = await Utilisateur.create({
        email,
        mot_de_pass: hashedPassword,
        nom,
        prenom,
        role ,// 'rh' ou 'encadrant'
        specialite_encadrant: role === 'encadrant' ? specialite : null,
        statut_compte: 'actif'
      });

     // Envoi d'email 
      sendWelcomeEmail(email, tempPassword, role, nom , prenom); 

      // Ne pas renvoyer le mot de passe même temporaire
      const userData = user.toJSON();
      delete userData.mot_de_pass;

      res.status(201).json({
        message: `Compte ${role} créé avec succès. Email envoyé à ${email}`,
        user: userData
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  , 
  // Liste des comptes RH/Encadrants
 
  async listStaffAccounts(req, res) {
  try {
    const { role } = req.query; // Récupère le paramètre de requête 'role'
    
    // Construction du filtre de base
    const whereClause = {
      role: ['rh', 'encadrant'] // Filtre de base pour ne récupérer que ces rôles
    };

    // Filtre par rôle si spécifié et valide
    if (role && ['rh', 'encadrant'].includes(role)) {
      whereClause.role = role;
    } else if (role) {
      // Si le rôle est spécifié mais invalide
      return res.status(400).json({ 
        error: "Rôle invalide. Choisissez entre: rh, encadrant" 
      });
    }

    // Récupération des membres du personnel
    const staffMembers = await Utilisateur.findAll({
      where: whereClause,
      attributes: { exclude: ['mot_de_pass'] },
      order: [['created_at', 'DESC']], // Tri par date de création décroissante
      raw: true
    });

    // Formatage des résultats
    const filteredMembers = staffMembers.map(member => ({
      id: member.id,
      email: member.email,
      nom: member.nom,
      prenom: member.prenom,
      role: member.role,
      specialite_encadrant: member.role === 'encadrant' ? member.specialite_encadrant : null,
      statut_compte: member.statut_compte,
      created_at: member.created_at
    }));

    if (filteredMembers.length === 0) {
      return res.status(200).json({
        message: role 
          ? `Aucun membre avec le rôle ${role} trouvé.`
          : "Aucun membre du personnel trouvé."
      });
    }

    res.json(filteredMembers);

  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      error: "Erreur serveur",
      type: "technical" 
    });
  }
},
// Fonction pourgérer les actions admin sur les comptes
async manageStaffAccount(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Accès réservé aux admins" });
    }

    const { action } = req.body;
    const user = await Utilisateur.findByPk(req.params.id);
    if (!user) throw new Error("Utilisateur non trouvé");

    const ancienneValeur = user.statut_compte;
    switch(action) {
      case 'disable':
        user.statut_compte = 'inactif';
        break;
      case 'enable':
        user.statut_compte = 'actif';
        break;
      case 'delete':
        await user.destroy();
        return res.json({ message: "Compte supprimé" });
      default:
        throw new Error("Action invalide");
    }

    await user.save();

    // Envoi de l'e-mail
    await sendAccountStatusEmail(
      user.email, user.nom, user.prenom, user.statut_compte
    );

    // Historisation
    await creerHistoriqueModification({
      table_modifiee: 'utilisateur',
      id_compte: user.id,
      champ_modifie: 'statut_compte',
      ancienne_valeur: ancienneValeur,
      nouvelle_valeur: user.statut_compte,
      id_acteur: req.user.userId // ID de l'admin qui effectue l'action
    });

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
,

async getProfile  (req, res){
  try {
    const user = await Utilisateur.findByPk(req.user.userId, {
      attributes: ['id', 'nom', 'prenom', 'email', 'role', 'specialite_encadrant', 'statut_compte', 'created_at','etablissement','telephone','niveau_etudes']
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const profile = {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      statut_compte: user.statut_compte,
      created_at: user.created_at,
      telephone: user.telephone,
      niveau_etudes:user.niveau_etudes,
      etablissement:user.etablissement
    };

    if (user.role === 'encadrant') {
      profile.specialite_encadrant = user.specialite_encadrant;
    }

    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}
,
async updateProfil(req, res) {
  const userId = req.user.userId;
  const { nom, prenom, specialite_encadrant, telephone, niveau_etudes, etablissement } = req.body;

  try {
    const user = await Utilisateur.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Champs communs à tous les rôles
    user.nom = nom;
    user.prenom = prenom;
    user.telephone = telephone || null;
    user.niveau_etudes = niveau_etudes || null;
    user.etablissement = etablissement || null;

    // Champ spécifique aux encadrants
    if (user.role === 'encadrant' && specialite_encadrant !== undefined) {
      user.specialite_encadrant = specialite_encadrant;
    }

    await user.save();
    return res.json({ 
      message: 'Profil mis à jour',
      updatedFields: {
        nom,
        prenom,
        telephone,
        niveau_etudes,
        etablissement,
        ...(user.role === 'encadrant' && { specialite_encadrant })
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
}
,
async changerMotDePasse(req, res) {
  const userId = req.user.userId;
  const { ancien_mot_de_pass, nouveau_mot_de_pass } = req.body;

  try {
    const user = await Utilisateur.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const match = await bcrypt.compare(ancien_mot_de_pass, user.mot_de_pass);
    if (!match) {
      return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
    }

    const nouveauHash = await bcrypt.hash(nouveau_mot_de_pass, 10);
    user.mot_de_pass = nouveauHash;
    await user.save();

    return res.json({ message: 'Mot de passe mis à jour avec succès' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du mot de passe' });
  }
}
,
// Fonction pour récupérer les encadrants
/*
async getEncadrants(req, res) {
  try {
    const { search } = req.query;

    const whereClause = {
      role: 'encadrant'
    };

    if (search) {
      whereClause[Op.or] = [
        { nom: { [Op.iLike]: `%${search}%` } },
        { prenom: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const encadrants = await Utilisateur.findAll({
      where: whereClause,
      attributes: ['id', 'nom', 'prenom', 'email', 'specialite_encadrant']
    });

    res.json(encadrants);
  } catch (error) {
    console.error("Erreur lors de la récupération des encadrants :", error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}
*/
async  getEncadrants(req, res) {
  try {
    const { search } = req.query;

    const whereClause = {
      role: 'encadrant'
    };

    if (search) {
      whereClause[Op.or] = [
        { nom: { [Op.iLike]: `%${search}%` } },
        { prenom: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const encadrants = await Utilisateur.findAll({
      where: whereClause,
      attributes: [
        'id', 'nom', 'prenom', 'email', 'specialite_encadrant',
        // Sous-requête pour compter les stages en cours
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM "Stage" AS s
            WHERE 
              s.encadrant_id = "Utilisateur".id
              AND s.statut_stage = 'En cours'
          )`),
          'nbStagesEnCours'
        ]
      ]
    });

    res.json(encadrants);
  } catch (error) {
    console.error("Erreur lors de la récupération des encadrants :", error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}


};