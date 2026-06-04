const Job = require('../models/Job');
const Worker = require('../models/Worker');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const Joi = require('joi');
const { geocodeAddress } = require('../utils/geocoder');
const socketService = require('../services/socketService');

// Validation schemas
const createJobSchema = Joi.object({
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  requiredSkills: Joi.array().items(Joi.string()).min(1).required(),
  location: Joi.string().required(),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  budget: Joi.number().min(0).optional(),
  duration: Joi.string().optional()
}).unknown(true);
const updateJobSchema = createJobSchema;

const applyJobSchema = Joi.object({
  message: Joi.string().max(500).optional()
});

// Create job posting
exports.createJob = async (req, res) => {
  try {
    const { error } = updateJobSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const hasSharedCoordinates =
      Number.isFinite(Number(req.body.lat)) && Number.isFinite(Number(req.body.lng));

    let geometry = undefined;
    if (hasSharedCoordinates) {
      geometry = {
        type: 'Point',
        coordinates: [Number(req.body.lng), Number(req.body.lat)]
      };
    } else if (req.body.location) {
      const geo = await geocodeAddress(req.body.location);
      if (geo) {
        geometry = { type: 'Point', coordinates: [geo.longitude, geo.latitude] };
      }
    }

    const { lat, lng, ...jobPayload } = req.body;

    const job = new Job({
      ...jobPayload,
      customer: req.user.id,
      ...(geometry && { geometry })
    });

    await job.save();

    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update job posting
exports.updateJob = async (req, res) => {
  try {
    const { error } = createJobSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    let job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this job' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ message: 'Only open jobs can be edited' });
    }

    const hasSharedCoordinates =
      Number.isFinite(Number(req.body.lat)) && Number.isFinite(Number(req.body.lng));

    const { lat, lng, ...updatePayload } = req.body;
    let updateData = { ...updatePayload };
    if (hasSharedCoordinates) {
      updateData.geometry = {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)]
      };
    } else if (req.body.location && req.body.location !== job.location) {
      const geo = await geocodeAddress(req.body.location);
      if (geo) {
        updateData.geometry = { type: 'Point', coordinates: [geo.longitude, geo.latitude] };
      }
    }

    job = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Job updated successfully',
      job
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete job posting
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    if (job.status === 'completed') {
      return res.status(400).json({ message: 'Cannot delete a completed job' });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all jobs
exports.getJobs = async (req, res) => {
  try {
    const { status = 'open', page = 1, limit = 10, lat, lng, maxDistance = 50000 } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    if (lat && lng) {
      query.geometry = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(maxDistance) // in meters
        }
      };
    }

    const jobs = await Job.find(query)
      .populate('customer', 'name location')
      .populate('assignedWorker', 'name profilePicture')
      .populate('applications.worker', 'name profilePicture')
      .sort(lat && lng ? undefined : { createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get job by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('customer', 'name location phone')
      .populate('assignedWorker', 'name location phone')
      .populate('applications.worker', 'name location');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current worker's applied job IDs
exports.getMyAppliedJobs = async (req, res) => {
  try {
    const jobs = await Job.find(
      { 'applications.worker': req.user.id },
      { _id: 1 }
    ).lean();

    return res.json({
      appliedJobIds: jobs.map((job) => String(job._id))
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Apply for job
exports.applyForJob = async (req, res) => {
  try {
    const { error } = applyJobSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ message: 'Job is not open for applications' });
    }

    // Check if already applied
    const alreadyApplied = job.applications.some(app => 
      app.worker.toString() === req.user.id
    );
    
    if (alreadyApplied) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    job.applications.push({
      worker: req.user.id,
      message: req.body.message
    });

    await job.save();

    // Create Notification and Emit
    const notif = await Notification.create({
      recipient: job.customer,
      type: 'application_received',
      title: 'New Application',
      message: 'Someone has applied to your job: ' + job.title,
      link: '/dashboard'
    });
    socketService.emitNotification(job.customer, notif);

    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Accept application
exports.acceptApplication = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const application = job.applications.id(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Update application status
    application.status = 'accepted';
    job.assignedWorker = application.worker;
    job.status = 'assigned';

    // Reject other applications
    job.applications.forEach(app => {
      if (app._id.toString() !== req.params.applicationId) {
        app.status = 'rejected';
      }
    });

    await job.save();

    // Create Notification and Emit
    const notif = await Notification.create({
      recipient: application.worker,
      type: 'application_accepted',
      title: 'Application Accepted',
      message: 'Your application was accepted for: ' + job.title,
      link: '/dashboard'
    });
    socketService.emitNotification(application.worker, notif);

    res.json({ message: 'Application accepted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Decline application
exports.declineApplication = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const application = job.applications.id(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Update application status
    application.status = 'rejected';
    await job.save();

    // Create Notification and Emit
    const notif = await Notification.create({
      recipient: application.worker,
      type: 'application_rejected',
      title: 'Application Declined',
      message: 'Your application was declined for: ' + job.title,
      link: '/dashboard'
    });
    socketService.emitNotification(application.worker, notif);

    res.json({ message: 'Application declined successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Complete job
exports.completeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.customer.toString() !== req.user.id && job.assignedWorker.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    job.status = 'completed';
    job.completedAt = new Date();
    await job.save();

    // Update worker stats
    if (job.assignedWorker) {
      await Worker.findOneAndUpdate(
        { user: job.assignedWorker },
        { $inc: { completedJobs: 1 } }
      );
    }
    
    // Notify the other party
    const notifyTarget = job.customer.toString() === req.user.id 
      ? job.assignedWorker 
      : job.customer;
      
    if (notifyTarget) {
      const notif = await Notification.create({
        recipient: notifyTarget,
        type: 'job_completed',
        title: 'Job Completed',
        message: 'A job has been marked as completed: ' + job.title,
        link: '/dashboard'
      });
      socketService.emitNotification(notifyTarget, notif);
    }

    res.json({ message: 'Job completed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get recommended jobs for a worker based on their skills
exports.getRecommendedJobs = async (req, res) => {
  try {
    const worker = await Worker.findOne({ user: req.user.id });
    if (!worker) {
      return res.status(404).json({ message: 'Worker profile not found' });
    }

    const { page = 1, limit = 50 } = req.query;

    // Normalize worker skills to lowercase for case-insensitive matching
    const normalizedSkills = (worker.skills || []).map(s => s.trim().toLowerCase());

    // Find jobs that match worker's skills and are open
    const recommendedJobs = await Job.find({
      status: 'open',
      requiredSkills: { $in: normalizedSkills }
    })
    .populate('customer', 'name location')
    .populate('assignedWorker', 'name profilePicture')
    .populate('applications.worker', 'name profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Filter out jobs the worker has already applied for
    const filteredJobs = recommendedJobs.filter(job =>
      !job.applications.some(app => app.worker.toString() === req.user.id)
    );

    res.json({
      jobs: filteredJobs,
      total: filteredJobs.length,
      workerSkills: worker.skills
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Review worker for a completed job
exports.reviewJob = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Valid rating between 1 and 5 is required' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed jobs' });
    }

    if (job.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the customer can review this job' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ job: job._id });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this job' });
    }

    const review = new Review({
      job: job._id,
      customer: req.user.id,
      worker: job.assignedWorker,
      rating,
      comment
    });

    await review.save();

    // Update worker average rating and total reviews
    const reviews = await Review.find({ worker: job.assignedWorker });
    const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
    
    await Worker.findOneAndUpdate(
      { user: job.assignedWorker },
      { 
        rating: avgRating,
        totalReviews: reviews.length
      }
    );

    // Mark job as reviewed so the button hides
    job.isReviewed = true;
    await job.save();

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ==========================================
// DIRECT JOB REQUEST EXTENSIONS
// ==========================================

// Get direct requests specifically for the logged-in user
exports.getDirectRequests = async (req, res) => {
  try {
    const query = { 
      $or: [
        { isDirectRequest: true },
        { status: 'pending' },
        { applications: { $size: 0 }, assignedWorker: { $exists: true, $ne: null }, status: { $ne: 'open' } }
      ]
    };
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    } else if (req.user.role === 'worker') {
      const worker = await Worker.findOne({ user: req.user.id });
      if (worker) {
        query.assignedWorker = worker.user;
      } else {
        query.assignedWorker = req.user.id;
      }
    }

    const jobs = await Job.find(query)
      .populate('customer', 'name profilePicture')
      .populate('assignedWorker', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a direct job request targeting a specific worker
exports.createDirectRequest = async (req, res) => {
  try {
    const { title, description, workerId, location, budget } = req.body;
    if (!title || !description || !workerId || !location) {
      return res.status(400).json({ message: 'Title, description, workerId, and location are required' });
    }

    const job = new Job({
      title,
      description,
      customer: req.user.id,
      assignedWorker: workerId, // directly assigning
      location,
      budget,
      status: 'pending',
      isDirectRequest: true,
      requiredSkills: []
    });

    await job.save();

    // Create Notification and Emit
    const notif = await Notification.create({
      recipient: workerId,
      type: 'direct_hire_request',
      title: 'New Direct Job Request',
      message: `You have received a direct job request: ${title}`,
      link: '/dashboard'
    });
    socketService.emitNotification(workerId, notif);

    res.status(201).json({ message: 'Direct request sent', job });
  } catch (error) {
    console.error('CREATE DIRECT REQUEST ERROR:', error);
    res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
  }
};

// Worker accepts direct request
exports.acceptDirectRequest = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job || !job.isDirectRequest) return res.status(404).json({ message: 'Direct job not found' });
    
    if (job.assignedWorker.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to accept this job' });
    }

    if (job.status !== 'pending') return res.status(400).json({ message: 'Job is not pending' });

    job.status = 'accepted';
    await job.save();

    const notif = await Notification.create({
      recipient: job.customer,
      type: 'application_accepted',
      title: 'Job Accepted',
      message: `Your direct request for ${job.title} was accepted!`,
      link: '/dashboard'
    });
    socketService.emitNotification(job.customer, notif);

    res.json({ message: 'Job accepted', job });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Customer shares location
exports.shareLocationDirectRequest = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) return res.status(400).json({ message: 'Coordinates required' });

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    
    if (job.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only customer can share location for this job' });
    }

    if (job.status !== 'accepted' && job.status !== 'assigned') return res.status(400).json({ message: 'Job must be accepted/assigned to share location' });

    job.geometry = {
      type: 'Point',
      coordinates: [Number(lng), Number(lat)]
    };
    await job.save();

    const notif = await Notification.create({
      recipient: job.assignedWorker,
      type: 'location_shared',
      title: 'Location Shared',
      message: `Customer has shared location for: ${job.title}`,
      link: '/dashboard'
    });
    socketService.emitNotification(job.assignedWorker, notif);

    res.json({ message: 'Location shared', job });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Start Job (Change to In Progress)
exports.startJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    
    // Either worker or customer can start
    if (job.customer.toString() !== req.user.id && job.assignedWorker.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (job.status !== 'accepted' && job.status !== 'assigned') {
      return res.status(400).json({ message: 'Job must be accepted/assigned to start' });
    }
    
    if (!job.geometry || !job.geometry.coordinates || job.geometry.coordinates.length < 2) {
      return res.status(400).json({ message: 'Location must be shared before starting' });
    }

    job.status = 'in-progress';
    job.startedAt = new Date();
    await job.save();

    res.json({ message: 'Job started', job });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};