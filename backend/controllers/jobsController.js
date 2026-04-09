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
  budget: Joi.number().min(0).optional(),
  duration: Joi.string().optional()
});

const applyJobSchema = Joi.object({
  message: Joi.string().max(500).optional()
});

// Create job posting
exports.createJob = async (req, res) => {
  try {
    const { error } = createJobSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    let geometry = undefined;
    if (req.body.location) {
      const geo = await geocodeAddress(req.body.location);
      if (geo) {
        geometry = { type: 'Point', coordinates: [geo.longitude, geo.latitude] };
      }
    }

    const job = new Job({
      ...req.body,
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

    let updateData = { ...req.body };
    if (req.body.location && req.body.location !== job.location) {
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
    
    let query = { status };

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

    // Find jobs that match worker's skills and are open
    const recommendedJobs = await Job.find({
      status: 'open',
      requiredSkills: { $in: worker.skills }
    })
    .populate('customer', 'name location')
    .sort({ createdAt: -1 })
    .limit(10);

    // Filter out jobs the worker has already applied for
    const filteredJobs = recommendedJobs.filter(job => 
      !job.applications.some(app => app.worker.toString() === req.user.id)
    );

    res.json({
      jobs: filteredJobs,
      total: filteredJobs.length
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

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};