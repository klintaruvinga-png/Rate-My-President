/**
 * Preloads animated flag WebP images for a list of country codes.
 *
 * Creates hidden Image objects so the browser fetches and caches the
 * flag URLs immediately. By the time SwipeCard mounts and requests them,
 * they will already be in the HTTP cache, resolving the blank-flag problem
 * on the Onboarding → Swipe transition.
 */
export function preloadFlags(countryCodes: string[]): void {
  for (const code of countryCodes) {
    const img = new Image();
    img.src = `https://animated-country-flags.malith.dev/webp/${code.toUpperCase()}.webp`;
    // Intentionally not attached to DOM; the browser caches the response regardless.
  }
}
