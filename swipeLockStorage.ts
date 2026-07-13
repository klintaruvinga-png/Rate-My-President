const LAST_SWIPE_DATE_KEY = 'rate-my-president-last-swipe-date';
const DAILY_SWIPE_COUNT_KEY = 'rate-my-president-daily-swipe-count';

function safeLocalStorage<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getDailySwipeState(hasHomeCountry: boolean) {
  if (typeof window === 'undefined') {
    return {
      count: 0,
      limit: hasHomeCountry ? 2 : 1,
      currentDay: getTodayKey(),
    };
  }

  const today = getTodayKey();
  const storedDay = safeLocalStorage(() => window.localStorage.getItem(LAST_SWIPE_DATE_KEY), null);
  const rawCount = safeLocalStorage(() => window.localStorage.getItem(DAILY_SWIPE_COUNT_KEY), '0');
  const count = storedDay === today ? parseInt(rawCount || '0', 10) || 0 : 0;

  return {
    count,
    limit: 1,
    currentDay: today,
  };
}

export function recordDailySwipe(hasHomeCountry: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  const { count, currentDay } = getDailySwipeState(hasHomeCountry);
  const nextCount = Math.min(count + 1, 1);

  safeLocalStorage(() => {
    window.localStorage.setItem(LAST_SWIPE_DATE_KEY, currentDay);
    window.localStorage.setItem(DAILY_SWIPE_COUNT_KEY, String(nextCount));
    return true;
  }, undefined);
}

export function isSwipeLimitReached(hasHomeCountry: boolean) {
  const { count, limit } = getDailySwipeState(hasHomeCountry);
  return count >= limit;
}

export function getSwipeCountRemaining(hasHomeCountry: boolean) {
  const { count, limit } = getDailySwipeState(hasHomeCountry);
  return Math.max(0, limit - count);
}

export function getNextDailyResetTimestamp() {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return tomorrow.getTime();
}

export function getRemainingUntilReset() {
  const remaining = getNextDailyResetTimestamp() - Date.now();
  return Math.max(0, remaining);
}
