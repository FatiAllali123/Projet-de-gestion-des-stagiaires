const express = require('express');
const router = express.Router();
const { proposerPeriode, traiterPeriode ,getPropositionsByCandidature,getPropositionsNonTraitees,getPropositionsTraitees} = require('../controllers/PropositionDatesController');
const authMiddleware = require('../middlewares/authMiddleware'); // si tu as un middleware d'auth

// Route pour proposer une période (RH)
router.post('/proposer', authMiddleware.authenticate , authMiddleware.isRH, proposerPeriode);

// Route pour traiter une proposition (candidat)
router.put('/traiter/:proposition_id', authMiddleware.authenticate, authMiddleware.isCandidat,  traiterPeriode);
router.get('/propositions/candidature/:candidature_id',authMiddleware.authenticate, getPropositionsByCandidature);
// Récupérer les propositions non traitées pour un candidat donné
router.get('/propositions/non-traitees/:candidature_id',authMiddleware.authenticate, authMiddleware.isCandidat,getPropositionsNonTraitees);
router.get('/propositions/traitees/:candidature_id',authMiddleware.authenticate, authMiddleware.isCandidat,getPropositionsTraitees);

module.exports = router;
