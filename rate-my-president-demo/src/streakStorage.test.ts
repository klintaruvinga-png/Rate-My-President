import { describe, it, expect, beforeEach } from 'vitest';
import { recordVoteToday, getStreak } from './streakStorage';

// Minimal in-memory localStorage shim so streakStorage (which reads
// window.localStorage) is exercisable under vitest's node environment.
function createLocalStorageShim() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
}

const USER = 'test-user-123';

beforeEach(() => {
  // @ts-expect-error - installing a test window
  globalThis.window = { localStorage: createLocalStorageShim() };
  // Clear any persisted state for the test user between cases.
  (globalThis.window as any).localStorage.removeItem(`rate-my-president-streak-${USER}`);
});

describe('streakStorage', () => {
  it('starts at 0 when no votes recorded', () => {
    expect(getStreak(USER)).toBe(0);
  });

  it('records a vote and returns streak 1 on first day', () => {
    expect(recordVoteToday(USER)).toBe(1);
    expect(getStreak(USER)).toBe(1);
  });

  it('is idempotent within the same day (does not double-count)', () => {
    recordVoteToday(USER);
    recordVoteToday(USER);
    recordVoteToday(USER);
    expect(getStreak(USER)).toBe(1);
  });

  it('increments on a consecutive day', () => {
    // Seed a streak whose last vote was "yesterday".
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    (globalThis.window as any).localStorage.setItem(
      `rate-my-president-streak-${USER}`,
      JSON.stringify({ lastVoteDate: yKey, streak: 3 })
    );
    expect(recordVoteToday(USER)).toBe(4);
    expect(getStreak(USER)).toBe(4);
  });

  it('resets to 1 after a gap of more than one day', () => {
    // Seed a streak whose last vote was 3 days ago (broken).
    const old = new Date();
    old.setDate(old.getDate() - 3);
    const oKey = `${old.getFullYear()}-${String(old.getMonth() + 1).padStart(2, '0')}-${String(old.getDate()).padStart(2, '0')}`;
    (globalThis.window as any).localStorage.setItem(
      `rate-my-president-streak-${USER}`,
      JSON.stringify({ lastVoteDate: oKey, streak: 9 })
    );
    expect(recordVoteToday(USER)).toBe(1); // broken -> restart at 1
    expect(getStreak(USER)).toBe(1);
  });

  it('returns 0 for a broken streak on read (before next vote)', () => {
    const old = new Date();
    old.setDate(old.getDate() - 3);
    const oKey = `${old.getFullYear()}-${String(old.getMonth() + 1).padStart(2, '0')}-${String(old.getDate()).padStart(2, '0')}`;
    (globalThis.window as any).localStorage.setItem(
      `rate-my-president-streak-${USER}`,
      JSON.stringify({ lastVoteDate: oKey, streak: 9 })
    );
    expect(getStreak(USER)).toBe(0); // not today/yesterday -> broken
  });

  it('is a no-op with no userId', () => {
    expect(recordVoteToday('')).toBe(0);
    expect(getStreak('')).toBe(0);
  });
});
