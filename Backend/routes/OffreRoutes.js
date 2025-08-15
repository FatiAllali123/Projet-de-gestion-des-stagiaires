const express = require('express');
const router = express.Router();
const OffreController = require('../controllers/OffreController');
const { isRH , authenticate , isCandidat} = require('../middlewares/authMiddleware.js');

router.post('/newOffre', authenticate,isRH, OffreController.createOffre);
router.put('/:id/update', authenticate, isRH , OffreController.updateOffre);
router.put('/:id/status', authenticate,isRH, OffreController.toggleOffreStatus);
router.get('/', authenticate , OffreController.getAllOffres);
router.get('/filtred' , OffreController.filtrerOffres);
router.delete('/:id/delete', authenticate,isRH,  OffreController.deleteOffre);
router.get('/AllOffres',   OffreController.getAllActiveOffres);

module.exports = router;
