import { getUserCountry } from './onboardingStorage';

export type UserMode = 'home' | 'global-only';

/**
 * Determines the user's mode based on whether they have a home country set.
 * - 'home': User has a home country (gets 2 daily swipes: home + global)
 * - 'global-only': User has no home country (gets 1 daily swipe: global only)
 */
export function getUserMode(): UserMode {
  const homeCountry = getUserCountry();
  return homeCountry ? 'home' : 'global-only';
}

/**
 * Returns the daily swipe limit based on user mode.
 */
export function getDailySwipeLimit(mode: UserMode): number {
  return mode === 'home' ? 2 : 1;
}

/**
 * Returns whether the user should see a home country card.
 */
export function shouldShowHomeCard(mode: UserMode): boolean {
  return mode === 'home';
}
