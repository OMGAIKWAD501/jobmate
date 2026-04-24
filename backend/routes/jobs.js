const express = require('express');
const { createJob, getJobs, getJobById, applyForJob, acceptApplication, declineApplication, completeJob, getRecommendedJobs, updateJob, reviewJob, deleteJob, getMyAppliedJobs, createDirectRequest, acceptDirectRequest, shareLocationDirectRequest, startJob, getDirectRequests } = require('../controllers/jobsController');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getJobs);
router.get('/my-applications', auth, requireRole(['worker']), getMyAppliedJobs);

// Direct request routes MUST BE BEFORE /:id
router.get('/direct-requests', auth, getDirectRequests);
router.post('/direct-request', auth, requireRole(['customer']), createDirectRequest);
router.put('/:id/direct-accept', auth, requireRole(['worker']), acceptDirectRequest);
router.put('/:id/share-location', auth, requireRole(['customer']), shareLocationDirectRequest);
router.put('/:id/start', auth, startJob); // Either can start

// Customer-only routes
router.post('/', auth, requireRole(['customer']), createJob);
router.put('/:id', auth, requireRole(['customer']), updateJob);
router.delete('/:id', auth, requireRole(['customer']), deleteJob);
router.put('/:jobId/applications/:applicationId/accept', auth, requireRole(['customer']), acceptApplication);
router.put('/:jobId/applications/:applicationId/decline', auth, requireRole(['customer']), declineApplication);
router.put('/:id/complete', auth, completeJob);
router.post('/:id/review', auth, requireRole(['customer']), reviewJob);

// Worker-only routes
router.post('/:id/apply', auth, requireRole(['worker']), applyForJob);
router.get('/recommended/for-worker', auth, requireRole(['worker']), getRecommendedJobs);

// Fallback exact ID getter must be last to prevent shadowing
router.get('/:id', getJobById);

module.exports = router;