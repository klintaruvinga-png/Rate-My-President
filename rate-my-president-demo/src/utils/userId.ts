// Anonymous local UUID for swipe tracking (PRD: no device fingerprinting).
// Persisted in localStorage so a user's daily-limit state is stable per browser.

const STORAGE_KEY = 'rmp_user_id';

function generateUuid(): string {
  // RFC4122 v4
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getUserId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = generateUuid();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // localStorage unavailable (private mode); return ephemeral id
    return generateUuid();
  }
}
