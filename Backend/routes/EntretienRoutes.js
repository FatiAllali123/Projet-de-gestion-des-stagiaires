// routes/entretien.routes.js
const express = require('express');
const router = express.Router();
const entretienController = require('../controllers/EntretienController');
const { authenticate , isCandidat, isRH} = require('../middlewares/authMiddleware.js');


// RH seulement
router.post('/candidature/:id/planifier',authenticate, isRH, entretienController.planifier);
router.put( '/:id/annuler',authenticate, isRH,entretienController.annuler);
router.put('/:id/terminer',authenticate, isRH,entretienController.terminer);
router.put('/:id/modifier', authenticate, isRH,entretienController.modifierEntretien);
module.exports = router;