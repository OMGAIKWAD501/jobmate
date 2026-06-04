const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requiredSkills: [{
    type: String
  }],
  location: {
    type: String,
    required: true
  },
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      required: false
    },
    coordinates: {
      type: [Number],
      required: false // [longitude, latitude]
    }
  },
  budget: {
    type: Number,
    min: 0
  },
  duration: {
    type: String, // e.g., "2 hours", "1 day"
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'open', 'accepted', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'open'
  },
  isDirectRequest: {
    type: Boolean,
    default: false
  },
  startedAt: Date,
  assignedWorker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  applications: [{
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  isReviewed: {
    type: Boolean,
    default: false
  }
});

// Index for search
jobSchema.index({ requiredSkills: 1, status: 1 });
jobSchema.index({ geometry: '2dsphere' }); // Geo-spatial indexing

// Normalize skills to lowercase before save for consistent matching
jobSchema.pre('save', function (next) {
  if (this.requiredSkills && Array.isArray(this.requiredSkills)) {
    this.requiredSkills = this.requiredSkills.map(s => s.trim().toLowerCase());
  }
  next();
});

module.exports = mongoose.model('Job', jobSchema);