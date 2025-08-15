
const express = require('express');
const router = express.Router();
const absenceController = require('../controllers/absenceController');
const { authenticate , isEncadrant} = require('../middlewares/authMiddleware.js');
router.post('/marquer', authenticate , isEncadrant ,absenceController.marquerAbsence);
router.get('/:absence_id', absenceController.checkIsJustified);
router.get('/:stageId/absences', authenticate , absenceController.getAbsencesByStageId);
module.exports = router;