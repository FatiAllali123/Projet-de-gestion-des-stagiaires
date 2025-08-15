const express = require('express');
const router = express.Router();
const { isRH , authenticate , isAdminOrRH , isCandidat} = require('../middlewares/authMiddleware.js');
const StageController = require('../controllers/StageController');


router.post('/new', authenticate, isRH,StageController.creerStage);
router.put('/:stageId/AffecterEncadrant', authenticate, isRH,StageController.affecterEncadrant);
router.put('/:stageId/changer-encadrant',  authenticate, isRH, StageController.changerEncadrantStage);
router.get('/', authenticate,isAdminOrRH ,  StageController.getStagesActifs);
router.get('/historique', authenticate, isAdminOrRH , StageController.getHistoriqueStages);


// Route pour un encadrant qui veut voir SES PROPRES stages
router.get('/encadrants/mes-stages',  authenticate, (req, res) => {
  // On dit à getEncadrantStages de chercher avec l'ID de l'utilisateur connecté
  req.params.id = req.user.userId; 
  return StageController.getEncadrantStages(req, res);
});

// Route pour les RH/Admin qui veulent voir les stages D'UN ENCADRANT SPÉCIFIQUE
router.get('/encadrants/:id/stages',  authenticate, isAdminOrRH, StageController.getEncadrantStages);
router.get('/mes-stages', authenticate,isCandidat, StageController.getStagiaireStages);
 
router.get('/:id',authenticate , StageController.getStageDetails);
router.get('/check-active/:candidatId', authenticate, StageController.getStagiaireStages);

router.get('/stages/evaluation-pending', authenticate, StageController.getStagesEvaluationPending);
module.exports = router;