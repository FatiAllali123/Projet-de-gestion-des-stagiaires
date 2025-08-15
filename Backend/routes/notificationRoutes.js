const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate} = require('../middlewares/authMiddleware.js');
router.get('/non-lues', authenticate, notificationController.getUnreadNotifications);
router.patch('/:id/lue', authenticate, notificationController.markAsRead);

module.exports = router;
