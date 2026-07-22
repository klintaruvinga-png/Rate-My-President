import { describe, it, expect, afterEach } from 'vitest';
import { getDailySwipeState } from '@root/swipeLockStorage';

// getDailySwipeState encodes the product swipe-limit rule (RMP PRD):
//   - no home country set -> limit 1/day
//   - home country set    -> limit 2/day (1 home leader + 1 international)
// It also guards SSR (typeof window === 'undefined') by returning a zeroed state.

function makeStorage(initial: Record<string, string> = {}) {
  const store: Record<string, string> = { ...initial };
  const ls: Storage = {
    get length() {
      return Object.keys(store).length;
    },
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
  return ls;
}

describe('getDailySwipeState', () => {
  const REAL_WINDOW = globalThis.window;

  afterEach(() => {
    if (REAL_WINDOW === undefined) {
      // @ts-expect-error - restore SSR state
      delete globalThis.window;
    } else {
      globalThis.window = REAL_WINDOW;
    }
  });

  it('returns limit 1 when no home country is set', () => {
    const state = getDailySwipeState(false);
    expect(state.limit).toBe(1);
  });

  it('returns limit 2 when home country is set', () => {
    const state = getDailySwipeState(true);
    expect(state.limit).toBe(2);
  });

  it('returns zeroed count under SSR (no window)', () => {
    // @ts-expect-error - simulate SSR
    delete globalThis.window;
    const state = getDailySwipeState(true);
    expect(state.count).toBe(0);
    expect(state.limit).toBe(2);
  });

  it('reports stored count for the current day, zeroed on a new day', () => {
    const today = new Date().toISOString().slice(0, 10);
    const ls = makeStorage({
      'rate-my-president-last-swipe-date': today,
      'rate-my-president-daily-swipe-count': '1',
    });
    globalThis.window = { localStorage: ls } as unknown as Window & typeof globalThis;

    const state = getDailySwipeState(false);
    expect(state.count).toBe(1);
    expect(state.limit).toBe(1);

    // simulate a new day
    ls.setItem('rate-my-president-last-swipe-date', '2000-01-01');
    const nextDay = getDailySwipeState(false);
    expect(nextDay.count).toBe(0);
  });
});
