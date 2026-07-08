import { getUserCountry } from './onboardingStorage';
import { availableCountries } from './countries';
import Onboarding from './Onboarding';

interface OnboardingDemoProps {
  onComplete?: (countryCode: string | null) => void;
}

export function OnboardingDemo({ onComplete }: OnboardingDemoProps) {
  // Read any previously saved country from localStorage so the user
  // doesn't have to search and pick again on subsequent visits.
  const savedCountryCode = getUserCountry();

  const handleOnboardingComplete = (countryCode: string | null) => {
    onComplete?.(countryCode);
  };

  return (
    <Onboarding
      availableCountries={availableCountries}
      defaultCountryCode={savedCountryCode}
      onComplete={handleOnboardingComplete}
    />
  );
}

export default OnboardingDemo;

