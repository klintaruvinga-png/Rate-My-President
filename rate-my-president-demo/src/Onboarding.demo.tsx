import Onboarding from './Onboarding';

interface CountryData {
  code: string;
  name: string;
  flag: string;
  leader?: string;
}

interface OnboardingDemoProps {
  onComplete?: (countryCode: string | null) => void;
}

export function OnboardingDemo({ onComplete }: OnboardingDemoProps) {
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
    onComplete?.(countryCode);
  };

  return (
    <Onboarding
      availableCountries={availableCountries}
      onComplete={handleOnboardingComplete}
    />
  );
}

export default OnboardingDemo;
