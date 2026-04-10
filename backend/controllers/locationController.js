const Worker = require('../models/Worker');
const Job = require('../models/Job');

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const DEFAULT_RADIUS_KM = 5;

const parsePositiveNumber = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

exports.getNearbyMatches = async (req, res) => {
  try {
    const lat = Number.parseFloat(req.query.lat);
    const lng = Number.parseFloat(req.query.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'Valid lat and lng query params are required.' });
    }

    const radiusKm = parsePositiveNumber(req.query.radius, DEFAULT_RADIUS_KM);
    const limit = Math.min(parsePositiveNumber(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const maxDistanceInMeters = Math.round(radiusKm * 1000);

    const workers = await Worker.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceInMeters',
          maxDistance: maxDistanceInMeters,
          spherical: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      { $sort: { distanceInMeters: 1, rating: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          skills: 1,
          hourlyRate: 1,
          rating: 1,
          completedJobs: 1,
          location: 1,
          distanceInMeters: 1,
          user: {
            _id: '$userDetails._id',
            name: '$userDetails.name',
            phone: '$userDetails.phone',
            profilePicture: '$userDetails.profilePicture'
          }
        }
      }
    ]);

    const jobs = await Job.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceInMeters',
          maxDistance: maxDistanceInMeters,
          spherical: true,
          query: { status: 'open' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerDetails'
        }
      },
      {
        $unwind: {
          path: '$customerDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      { $sort: { distanceInMeters: 1, createdAt: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          requiredSkills: 1,
          location: 1,
          budget: 1,
          duration: 1,
          status: 1,
          applications: 1,
          geometry: 1,
          distanceInMeters: 1,
          createdAt: 1,
          customer: {
            _id: '$customerDetails._id',
            name: '$customerDetails.name'
          }
        }
      }
    ]);

    return res.json({
      center: { lat, lng },
      radiusKm,
      limit,
      workers,
      jobs
    });
  } catch (error) {
    console.error('Error fetching nearby matches:', error);
    return res.status(500).json({ message: 'Failed to fetch nearby matches.' });
  }
};
