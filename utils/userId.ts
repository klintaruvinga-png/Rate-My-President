/**
 * User ID utilities for server-side user identification
 */

const USER_ID_KEY = 'rate-my-president-user-id';
const REGISTRATION_TIMEOUT_MS = 10000;
const HEARTBEAT_TIMEOUT_MS = 5000;

// Track in-flight registration promise to deduplicate concurrent calls
let inFlightRegistration: Promise<string> | null = null;

/**
 * Register a new user with the server and get a server-generated ID
 * This prevents client-side ID manipulation and ensures server-side tracking
 */
export async function registerUserId(): Promise<string> {
  if (typeof window === 'undefined') {
    return 'anonymous';
  }

  try {
    // Check if we already have a server-issued ID (fast path)
    let userId = localStorage.getItem(USER_ID_KEY);

    if (userId) {
      return userId;
    }

    // Deduplicate concurrent registration requests
    if (inFlightRegistration) {
      return await inFlightRegistration;
    }

    // Register with server to get a secure ID
    inFlightRegistration = (async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REGISTRATION_TIMEOUT_MS);

        const response = await fetch(`${apiBaseUrl}/api/user/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to register user');
        }

        const data = await response.json();

        // Validate response data
        if (!data || typeof data.userId !== 'string' || data.userId.trim() === '') {
          throw new Error('Invalid userId received from server');
        }

        userId = data.userId;

        // Store the server-issued ID
        localStorage.setItem(USER_ID_KEY, userId);

        return userId;
      } finally {
        inFlightRegistration = null;
      }
    })();

    return await inFlightRegistration;
  } catch (error) {
    console.error('Failed to register user ID:', error);
    // Fallback to anonymous if server is unavailable
    return 'anonymous';
  }
}

/**
 * Get the stored user ID
 * Returns the server-issued ID if available, otherwise null
 */
export function getUserId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(USER_ID_KEY);
  } catch (error) {
    console.error('Failed to get user ID:', error);
    return null;
  }
}

/**
 * Get the user ID for server communication
 * Ensures user is registered before returning ID
 */
export async function getServerUserId(countryCode?: string | null): Promise<string> {
  const userId = await registerUserId();
  return countryCode ? `${userId}_${countryCode}` : userId;
}

/**
 * Send heartbeat to server to update last seen timestamp
 * Helps track active users and detect abuse patterns
 */
export async function sendUserHeartbeat(): Promise<void> {
  const userId = getUserId();
  if (!userId) return;

  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEARTBEAT_TIMEOUT_MS);

    await fetch(`${apiBaseUrl}/api/user/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (error) {
    console.error('Failed to send user heartbeat:', error);
  }
}
