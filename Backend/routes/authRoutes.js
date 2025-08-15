// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware.js');
// Route de connexion
router.post('/login', authController.login);
// Route de déconnexion
router.post('/logout', authController.logout);
// Route publique
router.post('/signup', authController.signup); 
router.get('/current-user', authenticate, authController.getCurrentUser);

module.exports = router;