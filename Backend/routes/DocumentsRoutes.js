const express = require('express');
const router = express.Router();
const documentController = require('../controllers/DocumentController');
const { authenticate } = require('../middlewares/authMiddleware.js');
const uploadMiddleware = require('../middlewares/upload_document');
const { Document, Candidature, Stage, Utilisateur } = require('../models');
router.post(
  '/',
    uploadMiddleware.single('file'),
  authenticate,
  documentController.uploadDocument
);

// Route pour consulter un document
router.get('/:id/view', authenticate, documentController.viewDocument);



// ✅ Traitement de justificatif d'absence
router.post('/justificatif/:document_id/traiter',authenticate, documentController.traiterJustificatif);
router.get('/absences/:absence_id/historique-traitement', authenticate, documentController.getHistoriqueTraitementForAbsence);
// ✅ Récupérer le justificatif accepté pour une absence
router.get('/justificatif/valide/:absence_id', authenticate,documentController.getJustificationAcceptee);
router.get('/justificatif/:absence_id', authenticate, documentController.getJustificatifForAbsence);
// 📄 Rapports
router.get('/rapport/stage/:stage_id',authenticate, documentController.getRapportsByStage);
router.get('/rapport/valide/:stage_id',authenticate, documentController.getRapportValide);
router.get('/rapport/has-valide/:stage_id',authenticate ,  documentController.hasRapportValide);
router.get('/convention/traitees/:stage_id', documentController.getConventionsTraitees);
router.get('/documents/rapports-non-traites/:encadrantId', authenticate, documentController.getUntreatedReports);
router.post('/rapport/:document_id/traiter',authenticate, documentController.traiterRapport);
// 📄 Conventions
router.get('/convention/a-signer/:stage_id',authenticate, documentController.getConventionsASigner);
router.get('/convention/signee/:stage_id',authenticate, documentController.getConventionSignee);
router.get('/convention/has-signee/:stage_id', authenticate ,documentController.hasConventionSignee);
router.post('/convention/:document_id/traiter', authenticate ,documentController.traiterConvention);
router.get('/convention/traitees/', authenticate ,documentController.traiterConvention);
router.get('/convention/all/:stage_id', authenticate ,documentController.getAllConventions);
// Récupérer conventions à signer par candidature
router.get('/conventions-a-signer/candidature/:candidature_id', documentController.getConventionsASignerByCandidature);
// Récupérer conventions à signer déposées (non traitées) par stage
router.get('/conventions-a-signer/non-traitees/stage/:stage_id', documentController.getConventionsASignerNonTraitees);
// Récupérer conventions traitées par candidature
router.get('/conventions-traitees/candidature/:candidature_id', documentController.getConventionsTraiteesByCandidature);

router.get('/candidatures-attente-convention', authenticate, documentController.getCandidaturesAttenteConvention);
router.get('/conventions-candidat', authenticate, documentController.getConventionsCandidat);

router.get('/conventions-signees/candidat/:candidatId', authenticate, documentController.getConventionsSigneesByCandidat);



// Récupérer les conventions à signer par le RH
router.get('/conventions-rh/a-signer', authenticate, documentController.getConventionsASignerRH);

// Récupérer les conventions déjà signées par le RH
router.get('/conventions-rh/signees', authenticate, documentController.getConventionsSigneesRH);




// Nouvelle route pour vérifier la convention signée via le stage
router.get('/check-signed-convention/:candidatureId', authenticate, async (req, res) => {
  try {
    const { candidatureId } = req.params;

    // Trouver le stage associé à cette candidature
    const stage = await Stage.findOne({ 
      where: { candidature_id: candidatureId },
      include: [{
        model: Document,
        where: { type: 'convention signée' },
        required: false
      }]
    });

    if (!stage) {
      return res.json({ exists: false });
    }

    const hasSignedConvention = stage.Documents.some(
      doc => doc.type === 'convention signée' && doc.statut === 'accepté'
    );

    res.json({ exists: hasSignedConvention });
  } catch (error) {
    console.error('Error checking signed convention:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



// 📄 Attestations
router.get('/attestation/has/:stage_id',authenticate, documentController.hasAttestationStage);
router.get('/attestation/:stage_id',authenticate, documentController.getAttestationStage);
router.post('/attestation/generer',authenticate , documentController.genererAttestation);

module.exports = router;