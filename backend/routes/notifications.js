const express = require('express');
const { 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead,
  acceptDirectHireRequest
} = require('../controllers/notificationsController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all notification routes
router.use(auth);

router.get('/', getUserNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/accept-hire', acceptDirectHireRequest);
router.put('/:id/read', markAsRead);

module.exports = router;
