const express = require('express');
const { createJob, getJobs, getJobById, applyForJob, acceptApplication, completeJob, getRecommendedJobs, updateJob, reviewJob, deleteJob } = require('../controllers/jobsController');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getJobs);
router.get('/:id', getJobById);

// Customer-only routes
router.post('/', auth, requireRole(['customer']), createJob);
router.put('/:id', auth, requireRole(['customer']), updateJob);
router.delete('/:id', auth, requireRole(['customer']), deleteJob);
router.put('/:jobId/applications/:applicationId/accept', auth, requireRole(['customer']), acceptApplication);
router.put('/:id/complete', auth, completeJob);
router.post('/:id/review', auth, requireRole(['customer']), reviewJob);

// Worker-only routes
router.post('/:id/apply', auth, requireRole(['worker']), applyForJob);
router.get('/recommended/for-worker', auth, requireRole(['worker']), getRecommendedJobs);

module.exports = router;