const Worker = require('../models/Worker');
const User = require('../models/User');
const Joi = require('joi');

// Validation schemas
const updateProfileSchema = Joi.object({
  skills: Joi.array().items(Joi.string()).min(1).required(),
  experience: Joi.number().min(0).optional(),
  hourlyRate: Joi.number().min(0).optional(),
  description: Joi.string().max(500).optional(),
  availability: Joi.string().valid('available', 'busy', 'unavailable').optional()
});

// Search workers
exports.searchWorkers = async (req, res) => {
  try {
    const { skill, location, minRating, maxRate, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (skill) {
      query.skills = { $in: [new RegExp(skill, 'i')] };
    }
    
    if (location) {
      query['user.location'] = new RegExp(location, 'i');
    }
    
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }
    
    if (maxRate) {
      query.hourlyRate = { $lte: parseFloat(maxRate) };
    }

    const workers = await Worker.find(query)
      .populate('user', 'name location phone profilePicture')
      .sort({ rating: -1, completedJobs: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Worker.countDocuments(query);

    res.json({
      workers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get worker by ID
exports.getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findOne({ user: req.params.id })
      .populate('user', '-password');
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.json(worker);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update worker profile
exports.updateProfile = async (req, res) => {
  try {
    const { error } = updateProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const worker = await Worker.findOne({ user: req.user.id });
    if (!worker) {
      return res.status(404).json({ message: 'Worker profile not found' });
    }

    const { skills, experience, hourlyRate, description, availability } = req.body;
    
    worker.skills = skills;
    if (experience !== undefined) worker.experience = experience;
    if (hourlyRate !== undefined) worker.hourlyRate = hourlyRate;
    if (description !== undefined) worker.description = description;
    if (availability !== undefined) worker.availability = availability;

    await worker.save();

    res.json({
      message: 'Profile updated successfully',
      worker
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get top rated workers
exports.getTopWorkers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const workers = await Worker.find({ rating: { $gte: 4 } })
      .populate('user', 'name location profilePicture')
      .sort({ rating: -1, completedJobs: -1 })
      .limit(limit);

    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get reviews for a worker
exports.getWorkerReviews = async (req, res) => {
  try {
    const Review = require('../models/Review');
    const reviews = await Review.find({ worker: req.params.id })
      .populate('customer', 'name profilePicture')
      .populate('job', 'title')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};