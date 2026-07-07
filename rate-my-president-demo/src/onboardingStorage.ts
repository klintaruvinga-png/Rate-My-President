const STORAGE_KEY = 'rate-my-president-onboarding-complete';

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

export { STORAGE_KEY };
