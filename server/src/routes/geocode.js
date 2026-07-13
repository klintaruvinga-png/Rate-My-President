const express = require('express');
const { reverseGeocode } = require('../services/nominatim');

const router = express.Router();

router.get('/', async (req, res) => {
  const { lat, lon } = req.query;
  
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing lat or lon parameter' });
  }
  
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: 'Invalid lat or lon values' });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Invalid lat or lon values' });
  }
  
  try {
    const result = await reverseGeocode(latitude, longitude);
    
    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ error: 'Country not found' });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Geocoding service unavailable' });
  }
});

module.exports = router;
