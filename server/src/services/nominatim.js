const { cache } = require('./cache');

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function reverseGeocode(lat, lon) {
  const cacheKey = `geocode:${lat.toFixed(4)}:${lon.toFixed(4)}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Rate limit: ensure at least 1 second between requests
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 10000);

  try {
    const userAgent = process.env.NOMINATIM_USER_AGENT || 'rate-my-president/1.0';
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        headers: {
          'User-Agent': userAgent,
        },
        signal: abortController.signal,
      }
    );

    clearTimeout(timeoutId);

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
    clearTimeout(timeoutId);
    console.error('Nominatim geocoding error:', error);
    throw error;
  }
}

module.exports = { reverseGeocode };
