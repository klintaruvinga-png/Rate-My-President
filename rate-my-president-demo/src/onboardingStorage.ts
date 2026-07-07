const STORAGE_KEY = 'rate-my-president-onboarding-complete';
const COUNTRY_KEY = 'rate-my-president-user-country';

export function getHasCompletedOnboarding() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setHasCompletedOnboarding(value: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, String(value));
}

export function clearHasCompletedOnboarding() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

/** Returns the ISO-2 country code saved by the user, or null if none. */
export function getUserCountry(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(COUNTRY_KEY);
}

/** Persists the user's chosen home-country code. Pass null to clear. */
export function setUserCountry(countryCode: string | null) {
  if (typeof window === 'undefined') return;
  if (countryCode) {
    window.localStorage.setItem(COUNTRY_KEY, countryCode);
  } else {
    window.localStorage.removeItem(COUNTRY_KEY);
  }
}

export { STORAGE_KEY, COUNTRY_KEY };
