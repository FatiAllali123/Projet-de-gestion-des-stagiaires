
const { Notification } = require('../models');

async function getUnreadNotifications(req, res) {
  try {
    const userId = req.user.userId;

    const notifications = await Notification.findAll({
      where: {
        utilisateur_id: userId,
        est_lu: false
      },
      order: [['date_creation', 'DESC']]
    });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function markAsRead(req, res) {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findByPk(notificationId);

    if (!notification) {
      return res.status(404).json({ error: "Notification introuvable" });
    }

    if (notification.utilisateur_id !== req.user.userId) {
      return res.status(403).json({ error: "Accès interdit à cette notification" });
    }

    notification.est_lu = true;
    notification.date_lecture = new Date();
    await notification.save();

    res.status(200).json({ message: "Notification marquée comme lue" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Fonction utilitaire pour créer une notification
async function creerNotification({
  utilisateur_id,
  titre,
  message,
  type,
  lien_action,
  offre_id = null,
  candidature_id = null,
  entretien_id = null,
  stage_id = null,
  document_id = null
}) {
  
  return await Notification.create({
    utilisateur_id,
    titre,
    message,
    type,
    lien_action,
    est_lu: false,
    date_creation: new Date(),
    offre_id,
    candidature_id,
    entretien_id,
    stage_id,
    document_id
  }
);

  
}



module.exports = {
  getUnreadNotifications,
  markAsRead,
  creerNotification
};
