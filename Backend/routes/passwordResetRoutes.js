const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');

// Routes pour la réinitialisation de mot de passe
router.post('/request-reset', passwordResetController.requestReset);
router.get('/verify-token', passwordResetController.verifyToken);
router.post('/reset-password', passwordResetController.resetPassword);

module.exports = router;