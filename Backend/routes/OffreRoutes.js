const express = require('express');
const router = express.Router();
const OffreController = require('../controllers/OffreController');
const { isRH , authenticate , isCandidat} = require('../middlewares/authMiddleware.js');
const {Offre} = require('../models');
router.post('/newOffre', authenticate,isRH, OffreController.createOffre);
router.put('/:id/update', authenticate, isRH , OffreController.updateOffre);
router.put('/:id/status', authenticate,isRH, OffreController.toggleOffreStatus);
router.get('/', authenticate , OffreController.getAllOffres);
router.get('/filtred' , OffreController.filtrerOffres);
router.delete('/:id/delete', authenticate,isRH,  OffreController.deleteOffre);
router.get('/AllOffres',   OffreController.getAllActiveOffres);
router.get('/:id',authenticate ,  async (req, res) => {
  try {

    // Récupérer l'offre par son ID
    const offre = await Offre.findByPk(req.params.id); 
    if (!offre) {
      return res.status(404).json({ message: 'offre non trouvé' });
    }
    res.json(offre);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});
module.exports = router;
