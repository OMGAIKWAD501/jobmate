const Worker = require('../models/Worker');
const User = require('../models/User');
const Notification = require('../models/Notification');
const socketService = require('../services/socketService');
const Joi = require('joi');

// Validation schemas
const updateProfileSchema = Joi.object({
  skills: Joi.array().items(Joi.string()).min(1).required(),
  experience: Joi.number().min(0).optional(),
  hourlyRate: Joi.number().min(0).optional(),
  description: Joi.string().max(500).optional(),
  availability: Joi.string().valid('available', 'busy', 'unavailable').optional()
});
const updateLocationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required()
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

// Get nearby workers using geospatial aggregation
exports.getNearbyWorkers = async (req, res) => {
  try {
    const { lat, lng, radius = 10, limit = 20 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    const maxDistance = Math.round(Math.max(parseFloat(radius), 1) * 1000);
    const maxLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

    const workers = await Worker.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          distanceField: "distanceInMeters",
          maxDistance,
          spherical: true
        }
      },
      { $limit: maxLimit },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          "user": {
            _id: "$userDetails._id",
            name: "$userDetails.name",
            location: "$userDetails.location",
            phone: "$userDetails.phone",
            profilePicture: "$userDetails.profilePicture"
          },
          skills: 1,
          experience: 1,
          hourlyRate: 1,
          rating: 1,
          description: 1,
          completedJobs: 1,
          distanceInMeters: 1
        }
      }
    ]);

    res.json(workers);
  } catch (error) {
    console.error("GeoNear Error:", error);
    res.status(500).json({ message: "Server error getting nearby workers", error: error.message });
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

// Update worker geo location for nearby search
exports.updateWorkerLocation = async (req, res) => {
  try {
    const { error } = updateLocationSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { lat, lng } = req.body;
    const worker = await Worker.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          location: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          }
        },
        $setOnInsert: {
          user: req.user.id,
          skills: []
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    return res.json({
      message: 'Worker location updated successfully',
      location: worker.location
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
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

// Send direct hire request notification to worker
exports.sendDirectHireRequest = async (req, res) => {
  try {
    const workerUserId = req.params.id;

    const workerUser = await User.findById(workerUserId);
    if (!workerUser || workerUser.role !== 'worker') {
      return res.status(404).json({ message: 'Worker not found' });
    }

    if (String(workerUserId) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot send hire request to yourself' });
    }

    const requester = await User.findById(req.user.id).select('name');

    const notification = await Notification.create({
      recipient: workerUserId,
      sender: req.user.id,
      type: 'direct_hire_request',
      title: 'Direct Hire Request',
      message: `${requester?.name || 'A customer'} wants to hire you directly.`,
      link: `/workers/${workerUserId}`,
      actionStatus: 'pending'
    });

    socketService.emitNotification(workerUserId, notification);

    return res.status(201).json({ message: 'Hire request sent successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
