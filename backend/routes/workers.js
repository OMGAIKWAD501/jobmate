const express = require('express');
const { searchWorkers, getWorkerById, updateProfile, getTopWorkers, getWorkerReviews } = require('../controllers/workersController');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/search', searchWorkers);
router.get('/top', getTopWorkers);
router.get('/:id', getWorkerById);
router.get('/:id/reviews', getWorkerReviews);

// Worker-only routes
router.put('/profile', auth, requireRole(['worker']), updateProfile);

module.exports = router;