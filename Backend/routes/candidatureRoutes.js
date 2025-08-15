// routes/candidature.routes.js
const express = require('express');
const router = express.Router();
const candidatureController = require('../controllers/CandidatureController');
const { authenticate , isCandidat, isRH} = require('../middlewares/authMiddleware.js');
const upload = require('../middlewares/upload'); // ajuste le chemin si nécessaire
const { Document,  Stage } = require('../models');
// Postuler à une offre

router.post('/postuler',upload.fields([{ name: 'cv', maxCount: 1 },{ name: 'lettre_motivation', maxCount: 1 }]),authenticate,  isCandidat  , candidatureController.postuler);
router.post('/check/:offre_id',authenticate,  isCandidat  , candidatureController.checkAlreadyApplied);

// Récupérer mes candidatures
router.get('/mes-candidatures',authenticate,  isCandidat , candidatureController.getMesCandidatures);
router.get('/:offre_id/candidatures',authenticate,  isRH ,candidatureController.getCandidaturesPourOffre);

router.put('/:id/accepter',authenticate, isRH, candidatureController.accepterCandidature);

router.put( '/:id/refuser',authenticate, isRH,candidatureController.refuserCandidature);

router.put('/:id/preselectionner',authenticate, isRH,candidatureController.preselectionnerCandidature);
// Annuler une candidature
router.patch('/:id/annuler',authenticate,  isCandidat , candidatureController.annulerCandidature);
router.get(
  '/offres/:offre_id/check',
  authenticate,
  candidatureController.checkAlreadyApplied
);

// Obtenir le stage par candidature
router.get('/stage-by-candidature/:candidatureId', authenticate, async (req, res) => {
  try {
    const { candidatureId } = req.params;
    
    const stage = await Stage.findOne({
      where: { candidature_id: candidatureId },
      include: [{
        model: Document,
        where: { type: 'convention signée' },
        required: false
      }]
    });

    if (!stage) {
      return res.status(404).json({ 
        success: false,
        message: "Aucun stage trouvé pour cette candidature." 
      });
    }

    res.status(200).json({
      success: true,
      stage: {
        id: stage.id,
        hasSignedConvention: stage.Documents && stage.Documents.length > 0
      }
    });

  } catch (error) {
    console.error('Erreur récupération stage:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
});
module.exports = router;