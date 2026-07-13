const { cache } = require('./cache');

let requestChain = Promise.resolve();
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function enqueueRequest(task) {
  requestChain = requestChain.catch(() => undefined).then(async () => {
    const now = Date.now();
    const waitTime = Math.max(0, MIN_REQUEST_INTERVAL - (now - lastRequestTime));
    if (waitTime > 0) {
      await delay(waitTime);
    }
    const result = await task();
    lastRequestTime = Date.now();
    return result;
  });
  return requestChain;
}

async function reverseGeocode(lat, lon) {
  const cacheKey = `geocode:${lat.toFixed(4)}:${lon.toFixed(4)}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  return enqueueRequest(async () => {
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

      const result = countryCode ? { countryCode } : null;
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Nominatim geocoding error:', error);
      throw error;
    }
  });
}

module.exports = { reverseGeocode };
