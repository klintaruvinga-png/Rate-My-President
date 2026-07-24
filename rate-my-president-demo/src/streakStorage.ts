/**
 * Client-side voting-streak tracking.
 *
 * Per the product's privacy model (anonymous local UUID, no PII), the streak is
 * tracked in localStorage keyed by the anonymous userId — NOT sent to the server.
 * This mirrors onboardingStorage's defensive localStorage access.
 *
 * Streak = consecutive days with at least one successful vote. Voting again on
 * the same day does not increment (already counted). A gap of >1 day breaks it.
 */

function safeLocalStorage<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function dateKey(d: Date): string {
  // Local-date YYYY-MM-DD (not UTC) so "today" matches the user's day.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

interface StreakState {
  lastVoteDate: string | null;
  streak: number;
}

function storageKey(userId: string): string {
  return `rate-my-president-streak-${userId}`;
}

function readState(userId: string): StreakState {
  return safeLocalStorage(() => {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return { lastVoteDate: null, streak: 0 };
    const parsed = JSON.parse(raw) as StreakState;
    if (typeof parsed.streak !== 'number') return { lastVoteDate: null, streak: 0 };
    return parsed;
  }, { lastVoteDate: null, streak: 0 });
}

/**
 * Record a successful vote for today. Returns the resulting streak count.
 * Idempotent within a day.
 */
export function recordVoteToday(userId: string): number {
  if (!userId || typeof window === 'undefined') return 0;
  const today = dateKey(new Date());
  const state = readState(userId);

  if (state.lastVoteDate === today) {
    return state.streak; // already counted today
  }

  const nextStreak =
    state.lastVoteDate === yesterdayKey() ? state.streak + 1 : 1;

  const next: StreakState = { lastVoteDate: today, streak: nextStreak };
  safeLocalStorage(() => {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
    return true;
  }, undefined);

  return nextStreak;
}

/**
 * Current streak for display. Returns 0 if the streak is broken (last vote was
 * more than a day ago) — the stored count reactivates only after the next vote.
 */
export function getStreak(userId: string): number {
  if (!userId || typeof window === 'undefined') return 0;
  const state = readState(userId);
  if (!state.lastVoteDate) return 0;
  if (state.lastVoteDate === dateKey(new Date()) || state.lastVoteDate === yesterdayKey()) {
    return state.streak;
  }
  return 0; // broken — waiting for next vote to restart
}
