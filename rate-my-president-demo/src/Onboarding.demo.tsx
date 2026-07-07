import React, { useState } from 'react';
import Onboarding from './Onboarding';

interface CountryData {
  code: string;
  name: string;
  flag: string;
  leader?: string;
}

export function OnboardingDemo() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Example country data
  const availableCountries: CountryData[] = [
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', leader: 'Keir Starmer' },
    { code: 'US', name: 'United States', flag: '🇺🇸', leader: 'Donald Trump' },
    { code: 'FR', name: 'France', flag: '🇫🇷', leader: 'Emmanuel Macron' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', leader: 'Olaf Scholz' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵', leader: 'Fumio Kishida' },
    { code: 'IN', name: 'India', flag: '🇮🇳', leader: 'Narendra Modi' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷', leader: 'Luiz Inácio Lula da Silva' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', leader: 'Justin Trudeau' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺', leader: 'Anthony Albanese' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽', leader: 'Claudia Sheinbaum' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦', leader: 'Cyril Ramaphosa' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷', leader: 'Yoon Suk Yeol' },
  ];

  const handleOnboardingComplete = (countryCode: string | null) => {
    setSelectedCountry(countryCode);
    setHasCompletedOnboarding(true);
    console.log('Onboarding complete. Selected country:', countryCode);
  };

  const handleReset = () => {
    setHasCompletedOnboarding(false);
    setSelectedCountry(null);
  };

  if (hasCompletedOnboarding) {
    return (
      <div className="min-h-screen bg-[oklch(0.15_0.04_250)] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div>
            <h1 className="text-3xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">
              Onboarding complete!
            </h1>
            <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">
              {selectedCountry
                ? `You selected: ${availableCountries.find((c) => c.code === selectedCountry)?.flag} ${availableCountries.find((c) => c.code === selectedCountry)?.name}`
                : 'You chose Global cards only'}
            </p>
          </div>

          <p className="text-sm text-[oklch(0.75_0.02_250)] opacity-70 font-['Space_Grotesk']">
            Now you would proceed to your first SwipeCard...
          </p>

          <button
            onClick={handleReset}
            className="py-2 px-4 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <Onboarding
      availableCountries={availableCountries}
      onComplete={handleOnboardingComplete}
    />
  );
}

export default OnboardingDemo;
