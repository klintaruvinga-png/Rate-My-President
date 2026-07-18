const STORAGE_KEY = 'rate-my-president-onboarding-complete';
const COUNTRY_KEY = 'rate-my-president-user-country';
const COUNTRY_LOCK_KEY = 'rate-my-president-country-locked-until';

function safeLocalStorage<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function getHasCompletedOnboarding() {
  if (typeof window === 'undefined') {
    return false;
  }

  return safeLocalStorage(() => window.localStorage.getItem(STORAGE_KEY) === 'true', false);
}

export function setHasCompletedOnboarding(value: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  safeLocalStorage(() => {
    window.localStorage.setItem(STORAGE_KEY, String(value));
    return true;
  }, undefined);
}

export function clearHasCompletedOnboarding() {
  if (typeof window === 'undefined') {
    return;
  }

  safeLocalStorage(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  }, undefined);
}

/** Returns the ISO-2 country code saved by the user, or null if none. */
export function getUserCountry(): string | null {
  if (typeof window === 'undefined') return null;
  return safeLocalStorage(() => window.localStorage.getItem(COUNTRY_KEY), null);
}

/** Persists the user's chosen home-country code. Pass null to clear. */
export function setUserCountry(countryCode: string | null) {
  if (typeof window === 'undefined') return;
  safeLocalStorage(() => {
    if (countryCode) {
      window.localStorage.setItem(COUNTRY_KEY, countryCode);
    } else {
      window.localStorage.removeItem(COUNTRY_KEY);
    }
    return true;
  }, undefined);
}

export { STORAGE_KEY, COUNTRY_KEY };

/** Returns the timestamp when country selection can be changed again, or null if not locked */
export function getCountryLockUntil(): number | null {
  if (typeof window === 'undefined') return null;
  const stored = safeLocalStorage(() => window.localStorage.getItem(COUNTRY_LOCK_KEY), null);
  return stored ? parseInt(stored, 10) : null;
}

/** Sets a 24-hour lock on country selection from the current time */
export function setCountryLock() {
  if (typeof window === 'undefined') return;
  const lockUntil = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
  safeLocalStorage(() => {
    window.localStorage.setItem(COUNTRY_LOCK_KEY, String(lockUntil));
    return true;
  }, undefined);
}

/** Checks if country selection is currently locked */
export function isCountryLocked(): boolean {
  const lockUntil = getCountryLockUntil();
  if (!lockUntil) return false;
  return Date.now() < lockUntil;
}

/** Clears the country lock (for testing purposes) */
export function clearCountryLock() {
  if (typeof window === 'undefined') return;
  safeLocalStorage(() => {
    window.localStorage.removeItem(COUNTRY_LOCK_KEY);
    return true;
  }, undefined);
}
