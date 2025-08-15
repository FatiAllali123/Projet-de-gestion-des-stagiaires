const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const { authenticate , isEncadrant , isAdmin} = require('../middlewares/authMiddleware.js');


router.post('/new', authenticate, isEncadrant, evaluationController.creerEvaluation);
router.delete('/:evaluation_id/delete', authenticate, isAdmin, evaluationController.supprimerEvaluation);
router.get('/:stageId', evaluationController.getEvaluationByStageId);
module.exports = router;