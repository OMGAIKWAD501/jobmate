const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  skills: [{
    type: String,
    required: true,
    trim: true
  }],
  experience: {
    type: Number, // years of experience
    min: 0,
    default: 0
  },
  hourlyRate: {
    type: Number,
    min: 0
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available'
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  portfolio: [{
    title: String,
    description: String,
    images: [String] // URLs to images
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0] // [lng, lat]
    }
  }
}, {
  timestamps: true
});

// Index for search
workerSchema.index({ skills: 1, 'user.location': 1 });
workerSchema.index({ location: '2dsphere' });

// Normalize skills to lowercase before save for consistent matching
workerSchema.pre('save', function (next) {
  if (this.skills && Array.isArray(this.skills)) {
    this.skills = this.skills.map(s => s.trim().toLowerCase());
  }
  next();
});

module.exports = mongoose.model('Worker', workerSchema);