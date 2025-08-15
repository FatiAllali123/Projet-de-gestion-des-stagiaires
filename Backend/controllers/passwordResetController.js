const { Utilisateur, ResetPasswordRequest } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

require('dotenv').config();
// Configuration du  gmail
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER, // Email d'envoi (stocké dans .env)
    pass: process.env.EMAIL_PASSWORD //Mot de passe (stocké dans .env)
  }
});



module.exports = {
  // Demande de réinitialisation
  async requestReset(req, res) {
    try {
      const { email } = req.body;
      
      // Vérifier si l'utilisateur existe
      const user = await Utilisateur.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: "Aucun utilisateur avec cet email" });
      }

      // Générer un token unique et une date d'expiration
      const token = crypto.randomBytes(32).toString('hex');
      const expiredAt = new Date();
      expiredAt.setHours(expiredAt.getHours() + 1); // Expire dans 1 heure

      // Enregistrer la demande dans la base de données
      await ResetPasswordRequest.create({
        token,
        expiredAt,
        utilisateur_id: user.id
      });

      // Créer le lien de réinitialisation
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`; 

      // Envoyer l'email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        html: `
          <p>Bonjour ${user.prenom},</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour procéder :</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>Ce lien expirera dans 1 heure.</p>
          <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
        `
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: "Email de réinitialisation envoyé" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Vérification du token
  async verifyToken(req, res) {
    try {
      const { token } = req.query;  // Récupère le token depuis l'URL

      // Trouver la demande de réinitialisation
      const request = await ResetPasswordRequest.findOne({ 
        where: { 
          token,
          used: false,
          expiredAt: { [Op.gt]: new Date() } // Op.gt "Greater Than"
        }
      });

      if (!request) {
        return res.status(400).json({ error: "Token invalide ou expiré" });
      }

      res.status(200).json({ valid: true, userId: request.utilisateur_id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Réinitialisation du mot de passe
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // Trouver la demande de réinitialisation
      const request = await ResetPasswordRequest.findOne({ 
        where: { 
          token,
          used: false,
          expiredAt: { [Op.gt]: new Date() }
        }
      });

      if (!request) {
        return res.status(400).json({ error: "Token invalide ou expiré" });
      }

      // Hacher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Mettre à jour le mot de passe de l'utilisateur
      await Utilisateur.update(
        { mot_de_pass: hashedPassword },
        { where: { id: request.utilisateur_id } }
      );

      // Marquer le token comme utilisé
      await request.update({ used: true });

      res.status(200).json({ message: "Mot de passe réinitialisé avec succès" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};