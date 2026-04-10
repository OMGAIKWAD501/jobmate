const express = require('express');
const { searchWorkers, getWorkerById, updateProfile, getTopWorkers, getWorkerReviews, getNearbyWorkers, updateWorkerLocation, sendDirectHireRequest } = require('../controllers/workersController');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/search', searchWorkers);
router.get('/top', getTopWorkers);
router.get('/nearby', getNearbyWorkers);
router.post('/:id/hire-request', auth, requireRole(['customer']), sendDirectHireRequest);
router.get('/:id', getWorkerById);
router.get('/:id/reviews', getWorkerReviews);

// Worker-only routes
router.put('/profile', auth, requireRole(['worker']), updateProfile);
router.put('/location', auth, requireRole(['worker']), updateWorkerLocation);

module.exports = router;