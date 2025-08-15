// EmailService.js
const nodemailer = require('nodemailer');

module.exports = {
    // Fonction pour envoyer un email de bienvenue au rh , encadrant
  sendWelcomeEmail: async (email, password, role, nom , prenom) => {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
   await transporter.sendMail({
        to: email,
        subject: 'Votre compte professionnel',
        html: `<p>Bonjour ${prenom} ${nom},<br>
               Votre compte ${role} a été créé.<br>
               Email: ${email}<br>
               Mot de passe temporaire: <strong>${password}</strong><br>
               Veuillez vous connecter et changer votre mot de passe.</p>`
      });
    } catch (error) {
      console.error("Erreur d'envoi d'email:", error);
    }
  }, 


// email de notification de statut de compte
  sendAccountStatusEmail: async (email, nom, prenom, statut) => {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      const message =
        statut === 'actif'
          ? 'Votre compte a été réactivé. Vous pouvez à nouveau vous connecter.'
          : 'Votre compte a été désactivé. Vous ne pouvez plus accéder à la plateforme.';

      await transporter.sendMail({
        to: email,
        subject: `Mise à jour de votre compte`,
        html: `<p>Bonjour ${prenom} ${nom},<br>${message}</p>`
      });
    } catch (error) {
      console.error("Erreur d'envoi d'email:", error);
    }
  },


async  sendEntretienNotificationEmail(email, prenom, titreOffre, date_entretien, type = 'planification') {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    let subject = '';
    let html = '';

    if (type === 'planification') {
      subject = 'Entretien planifié';
      html = `<p>Bonjour ${prenom},<br>
              Un entretien a été planifié pour votre candidature à l'offre <strong>${titreOffre}</strong>.<br>
              Date de l'entretien : <strong>${date_entretien}</strong></p>`;
    } else if (type === 'modification') {
      subject = 'Date d\'entretien modifiée';
      html = `<p>Bonjour ${prenom},<br>
              La date de votre entretien pour l'offre <strong>${titreOffre}</strong> a été modifiée.<br>
              Nouvelle date : <strong>${date_entretien}</strong></p>`;
    } else if (type === 'annulation') {
      subject = 'Entretien annulé';
      html = `<p>Bonjour ${prenom},<br>
              Votre entretien pour l'offre <strong>${titreOffre}</strong> a été annulé.</p>`;
    }

    await transporter.sendMail({
      to: email,
      subject,
      html
    });

  } catch (error) {
    console.error("Erreur d'envoi d'email:", error);
  }
},

// Ajoutez ces nouvelles fonctions à votre EmailService
async sendCandidatureStatusEmail(email, prenom, titreOffre, statut) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const subject = `Mise à jour de votre candidature - ${titreOffre}`;
    const message = `Bonjour ${prenom},<br><br>
      Le statut de votre candidature pour l'offre "${titreOffre}" a été mis à jour :<br>
      <strong>${statut}</strong><br><br>
      Cordialement,<br>
      L'équipe RH`;

    await transporter.sendMail({
      to: email,
      subject,
      html: message
    });
  } catch (error) {
    console.error("Erreur d'envoi d'email:", error);
  }
},

async  sendStageCreationEmail(email, prenom, sujet_stage, date_debut, date_fin) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const subject = 'Un nouveau stage vous a été attribué';
    const html = `
      <p>Bonjour ${prenom},</p>
      <p>Un stage a été créé pour vous.</p>
      <ul>
        <li><strong>Sujet :</strong> ${sujet_stage}</li>
        <li><strong>Date de début :</strong> ${date_debut}</li>
        <li><strong>Date de fin :</strong> ${date_fin}</li>
      </ul>
      <p>Veuillez vous connecter à la plateforme pour consulter les détails.</p>
    `;

    await transporter.sendMail({
      to: email,
      subject,
      html
    });

  } catch (error) {
    console.error("Erreur d'envoi d'email de stage:", error);
  }
}
,

async  sendStageAssignmentEmail(email, prenom, sujet_stage, date_debut, date_fin) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const subject = 'Un nouveau stage vous a été attribué';
    const html = `
      <p>Bonjour ${prenom},</p>
      <p>Vous avez été désigné comme encadrant pour un nouveau stage : </p>
      <ul>
        <li><strong>Sujet du stage :</strong> ${sujet_stage}</li>
        <li><strong>Date de début :</strong> ${date_debut}</li>
        <li><strong>Date de fin :</strong> ${date_fin}</li>
      </ul>
      <p>Veuillez vous connecter à la plateforme pour consulter les détails.</p>
    `;

    await transporter.sendMail({
      to: email,
      subject,
      html
    });

  } catch (error) {
    console.error("Erreur d'envoi d'email de stage:", error);
  }
},

async sendEncadrantChangeEmail(email, prenom, sujetStage, type, dateDebut = null, dateFin = null) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    let subject, html;

    if (type === 'ajout') {
      subject = 'Nouvelle affectation comme encadrant';
      html = `
        <p>Bonjour ${prenom},</p>
        <p>Vous avez été désigné comme nouvel encadrant pour le stage :</p>
        <ul>
          <li><strong>Sujet :</strong> ${sujetStage}</li>
          ${dateDebut ? `<li><strong>Date de début :</strong> ${dateDebut}</li>` : ''}
          ${dateFin ? `<li><strong>Date de fin :</strong> ${dateFin}</li>` : ''}
        </ul>
        <p>Veuillez vous connecter à la plateforme pour consulter les détails du stage.</p>
        <p>Cordialement,<br>L'équipe des stages</p>
      `;
    } else if (type === 'retrait') {
      subject = 'Changement d\'affectation';
      html = `
        <p>Bonjour ${prenom},</p>
        <p>Vous n'êtes plus encadrant du stage :</p>
        <ul>
          <li><strong>Sujet :</strong> ${sujetStage}</li>
        </ul>
        <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'équipe RH.</p>
        <p>Cordialement,<br>L'équipe des stages</p>
      `;
    }

    await transporter.sendMail({
      from: `"Plateforme de Stages" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html
    });

    console.log(`Email de changement d'encadrant envoyé à ${email}`);

  } catch (error) {
    console.error("Erreur d'envoi d'email de changement d'encadrant:", error);
    throw error;
  }
}


};

        

