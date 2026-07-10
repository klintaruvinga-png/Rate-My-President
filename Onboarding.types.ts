/**
 * Rate My President — Onboarding Component Types
 */

/**
 * Country data structure for onboarding
 */
export interface CountryData {
  /** ISO 3166-1 alpha-2 country code (e.g., 'GB', 'FR', 'JP') */
  code: string;

  /** Full country name (e.g., 'United Kingdom', 'France') */
  name: string;

  /** Unicode flag emoji for the country (e.g., '🇬🇧') */
  flag: string;

  /** Optional: leader name to display on confirmation screen */
  leader?: string;

  /** Optional: URL to leader avatar image */
  avatarUrl?: string;
}

/**
 * Props for the Onboarding component
 */
export interface OnboardingProps {
  /**
   * Callback fired when user completes onboarding
   * @param countryCode ISO country code if selected, null if skipped
   */
  onComplete: (countryCode: string | null) => void;

  /**
   * Optional: Callback fired if user exits onboarding early
   */
  onSkip?: () => void;

  /**
   * Array of available countries for selection
   * Should be sorted by popularity or locale
   */
  availableCountries: CountryData[];
}

/**
 * Onboarding state (internal, for reference)
 */
export type OnboardingScreen =
  | 'intro'
  | 'mechanic-home'
  | 'mechanic-global'
  | 'mechanic-summary'
  | 'country-select'
  | 'confirmation';
