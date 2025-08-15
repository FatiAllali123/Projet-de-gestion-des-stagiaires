require('dotenv').config(); // Charge les variables d'environnement
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Utilisateur } = require('../models');
const nodemailer = require('nodemailer');
module.exports = {
  async login(req, res) {
    try {
      const { email, mot_de_pass } = req.body;

      // 1. Trouver l'utilisateur
      const user = await Utilisateur.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: "Email ou mot de passe incorrect" });
      }

    // Vérification du statut du compte
    if (user.statut_compte !== 'actif') {
      return res.status(403).json({ 
        error: "Compte désactivé",
        details: `Votre compte est actuellement ${user.statut_compte}`
      });
    }
      // 2. Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(mot_de_pass, user.mot_de_pass);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Email ou mot de passe incorrect" });
      }

      // 3. Générer un token valable 7 jours
      const token = jwt.sign(
        { userId: user.id, role: user.role ,  statut: user.statut_compte}, // Données à stocker dans le token
        process.env.JWT_SECRET, // Clé secrète du fichier .env
        { expiresIn: '7d' } // Expire dans 7 jours
      );

      // 4. Réponse avec le token et les infos utilisateur
      res.json({
        token,
        user: { id: user.id, email: user.email, role: user.role , statut: user.statut_compte }
      });

    } catch (error) {
      console.error("Erreur lors de la connexion :", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  async logout(req, res) {
    try {
    
    // Réponse standard
    res.status(200).json({ 
      success: true,
      message: "Déconnecté avec succès" 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la déconnexion"
    });
  }
  },

  // Signup pour les candidats (public)
  async signup(req, res) {
    try {
      const { email, mot_de_pass, nom, prenom, telephone , niveau_etudes , etablissement  } = req.body;

      // Vérifier si l'email existe déjà
      const exists = await Utilisateur.findOne({ where: { email } });
      if (exists) return res.status(400).json({ error: "Email déjà utilisé" });

      // Créer le compte avec rôle 'candidat' par défaut
      const hashedPassword = await bcrypt.hash(mot_de_pass, 10);
      const user = await Utilisateur.create({
        email,
        mot_de_pass: hashedPassword,
        nom,
        prenom,
        role: 'candidat', // Rôle forcé pour les inscriptions publiques
        telephone,        // Nouveau champ optionnel
        niveau_etudes,   // Nouveau champ optionnel
         etablissement    // Nouveau champ optionnel
      });

      // Retourner les données sans le mot de passe
      const userData = user.toJSON();
      delete userData.mot_de_pass;

      res.status(201).json(userData);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

async getCurrentUser(req, res) {
  try {
    // Le middleware authenticate a déjà vérifié le token et ajouté req.user
    res.json({ 
      success: true,
      role: req.user.role,
      statut: req.user.statut ,
      id: req.user.userId
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur" 
    });
  }
}


 

};