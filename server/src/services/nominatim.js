const { cache } = require('./cache');

async function reverseGeocode(lat, lon) {
  const cacheKey = `geocode:${lat.toFixed(4)}:${lon.toFixed(4)}`;
  
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'rate-my-president/1.0',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }
    
    const data = await response.json();
    const countryCode = data?.address?.country_code?.toUpperCase();
    
    if (countryCode) {
      cache.set(cacheKey, { countryCode });
      return { countryCode };
    }
    
    return null;
  } catch (error) {
    console.error('Nominatim geocoding error:', error);
    throw error;
  }
}

module.exports = { reverseGeocode };
