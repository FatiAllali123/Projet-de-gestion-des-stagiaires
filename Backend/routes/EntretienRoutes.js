// routes/entretien.routes.js
const express = require('express');
const router = express.Router();
const entretienController = require('../controllers/EntretienController');
const { authenticate , isCandidat, isRH} = require('../middlewares/authMiddleware.js');
const { Entretien } = require('../models');

// RH seulement
router.post('/candidature/:id/planifier',authenticate, isRH, entretienController.planifier);
router.put( '/:id/annuler',authenticate, isRH,entretienController.annuler);
router.put('/:id/terminer',authenticate, isRH,entretienController.terminer);
router.put('/:id/modifier', authenticate, isRH,entretienController.modifierEntretien);



router.get('/:id',authenticate ,  async (req, res) => {
  try {

    // Récupérer l'entretien par son ID
    const entretien = await Entretien.findByPk(req.params.id); 
    if (!entretien) {
      return res.status(404).json({ message: 'Entretien non trouvé' });
    }
    res.json(entretien);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});
module.exports = router;