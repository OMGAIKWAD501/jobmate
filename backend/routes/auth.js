const express = require('express');
const { register, login, getProfile, updateMyLocation } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', auth, getProfile);
router.put('/location', auth, updateMyLocation);

module.exports = router;