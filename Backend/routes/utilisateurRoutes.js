// routes/utilisateurRoutes.js
const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateurController');
const { isAdmin , authenticate , isAdminOrRH} = require('../middlewares/authMiddleware.js');

// profil utilisateur
router.get('/profil', authenticate, utilisateurController.getProfile);
router.put('/profil', authenticate, utilisateurController.updateProfil);
router.put('/changer-password', authenticate, utilisateurController.changerMotDePasse);
// Routes pour la gestion des utilisateurs
router.post('/',utilisateurController.createUser);
router.get('/', utilisateurController.getAllUsers);
router.get('/encadrants', authenticate, isAdminOrRH, utilisateurController.getEncadrants);
router.get('/:id', utilisateurController.getUserById);
router.put('/:id', utilisateurController.updateUser);
router.delete('/:id', utilisateurController.deleteUser);
// Route protégée admin
router.get('/admin/staff', authenticate , isAdmin, utilisateurController.listStaffAccounts); 

router.post('/admin/staff/create-account', authenticate, isAdmin, utilisateurController.createStaffAccount);
router.patch('/admin/staff/:id', authenticate, isAdmin, utilisateurController.manageStaffAccount); // Pour enable/disable
router.delete('/admin/staff/:id', authenticate, isAdmin, utilisateurController.manageStaffAccount); // Pour delete


module.exports = router;