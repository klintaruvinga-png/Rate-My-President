/**
 * User ID utilities for generating stable per-user identifiers
 */

const USER_ID_KEY = 'rate-my-president-user-id';

/**
 * Get or create a stable user ID stored in localStorage
 * This provides a consistent identifier across sessions without using device fingerprinting
 */
export function getUserId(): string {
  if (typeof window === 'undefined') {
    return 'anonymous';
  }

  try {
    let userId = localStorage.getItem(USER_ID_KEY);
    
    if (!userId) {
      // Generate a random UUID-like identifier
      userId = 'user_' + crypto.randomUUID();
      localStorage.setItem(USER_ID_KEY, userId);
    }
    
    return userId;
  } catch (error) {
    console.error('Failed to get user ID:', error);
    return 'anonymous';
  }
}

/**
 * Get the user ID for server communication
 * Combines with country code when available for more specific tracking
 */
export function getServerUserId(countryCode?: string | null): string {
  const userId = getUserId();
  return countryCode ? `${userId}_${countryCode}` : userId;
}
