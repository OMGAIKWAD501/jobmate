const express = require('express');
const router = express.Router();
const { getNearbyMatches } = require('../controllers/locationController');

// GET /api/location/nearby?lat=&lng=&radius=&limit=
router.get('/nearby', getNearbyMatches);

// POST /api/location
// Stateless logging of user location, prepared for future GeoJSON database integration
router.post('/', (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'Latitude and Longitude are required' });
    }

    // Future-proofing: GeoJSON Point structure
    const geoJsonPoint = {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };

    // Stateless logging: We fetch, use, and discard (or just log)
    console.log(`[Location Service] User location received - Lat: ${lat}, Lng: ${lng}`);
    console.log(`[Location Service] GeoJSON Ready Structure:`, geoJsonPoint);

    return res.status(200).json({
      message: 'Location received successfully',
      data: { lat, lng, geoJson: geoJsonPoint }
    });
  } catch (error) {
    console.error('[Location Service] Error processing location:', error);
    res.status(500).json({ message: 'Server error processing location', error: error.message });
  }
});

module.exports = router;
