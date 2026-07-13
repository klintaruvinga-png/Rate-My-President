/**
 * User ID utilities using anonymized local UUIDs
 * Complies with AGENTS.md: "Use anonymized local UUIDs for swipe tracking; avoid device fingerprinting"
 */

const USER_ID_KEY = 'rate-my-president-user-id';

/**
 * Generate a cryptographically secure local UUID
 * This is an anonymized local identifier, not server-tracked
 */
function generateLocalUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get or create a local anonymized UUID
 * This ID is generated locally and stored locally, never sent to a registration endpoint
 */
export function getLocalUserId(): string {
  if (typeof window === 'undefined') {
    return 'anonymous';
  }

  try {
    let userId = localStorage.getItem(USER_ID_KEY);
    
    if (!userId) {
      userId = generateLocalUUID();
      localStorage.setItem(USER_ID_KEY, userId);
    }
    
    return userId;
  } catch (error) {
    console.error('Failed to get user ID:', error);
    return 'anonymous';
  }
}

/**
 * Get the stored user ID
 * Returns the local UUID if available, otherwise null
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
 * Returns the local UUID without appending country code
 * The country code is handled separately by the server based on user preferences
 */
export async function getServerUserId(countryCode?: string | null): Promise<string> {
  // Country code is no longer appended to userId to avoid server mismatch
  // Server will determine swipe limits based on user_preferences table
  return getLocalUserId();
}

/**
 * Send heartbeat to server to update last seen timestamp
 * This is optional for local UUIDs but helps with analytics
 */
export async function sendUserHeartbeat(): Promise<void> {
  const userId = getUserId();
  if (!userId) return;

  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    await fetch(`${apiBaseUrl}/api/user/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  } catch (error) {
    console.error('Failed to send user heartbeat:', error);
  }
}
