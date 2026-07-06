import React, { useState, useEffect } from 'react';

type OnboardingScreen = 'intro' | 'mechanic-home' | 'mechanic-global' | 'mechanic-summary' | 'country-select' | 'confirmation';

interface CountryData {
  code: string;
  name: string;
  flag: string;
  leader?: string;
}

interface OnboardingProps {
  onComplete: (countryCode: string | null) => void;
  onSkip?: () => void;
  availableCountries: CountryData[];
}

export const Onboarding: React.FC<OnboardingProps> = ({
  onComplete,
  onSkip,
  availableCountries = [],
}) => {
  const [currentScreen, setCurrentScreen] = useState<OnboardingScreen>('intro');
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [detectedCountry, setDetectedCountry] = useState<CountryData | null>(null);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);

  // Detect user's geolocation on mount
  useEffect(() => {
    if (navigator.geolocation && availableCountries.length > 0) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, use reverse geocoding to get country from coordinates
          // For now, we'll use a simple fallback or IP-based detection
          // Placeholder: assume first country in list as fallback
          const fallback = availableCountries[0];
          setDetectedCountry(fallback);
          setSelectedCountry(fallback);
        },
        () => {
          // Geolocation failed; use IP-based detection or no default
          console.log('Geolocation permission denied or unavailable');
        }
      );
    }
  }, [availableCountries]);

  const handleAdvanceScreen = () => {
    switch (currentScreen) {
      case 'intro':
        setCurrentScreen('mechanic-home');
        break;
      case 'mechanic-home':
        setCurrentScreen('mechanic-global');
        break;
      case 'mechanic-global':
        setCurrentScreen('mechanic-summary');
        break;
      case 'mechanic-summary':
        setCurrentScreen('country-select');
        break;
      case 'country-select':
        if (selectedCountry) {
          setCurrentScreen('confirmation');
        }
        break;
      case 'confirmation':
        // Auto-advance to first swipe
        handleComplete();
        break;
    }
  };

  const handleBackScreen = () => {
    switch (currentScreen) {
      case 'mechanic-home':
        setCurrentScreen('intro');
        break;
      case 'mechanic-global':
        setCurrentScreen('mechanic-home');
        break;
      case 'mechanic-summary':
        setCurrentScreen('mechanic-global');
        break;
      case 'country-select':
        setCurrentScreen('mechanic-summary');
        break;
      case 'confirmation':
        setCurrentScreen('country-select');
        break;
    }
  };

  const handleSkipCountry = () => {
    setSelectedCountry(null);
    setCurrentScreen('confirmation');
  };

  const handleComplete = () => {
    setIsAutoAdvancing(true);
    setTimeout(() => {
      onComplete(selectedCountry?.code || null);
    }, 300);
  };

  const filteredCountries = availableCountries.filter((country) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Common background color
  const bgColor = 'bg-[oklch(0.15_0.04_250)]';
  const cardColor = 'bg-[oklch(0.20_0.02_250)]';

  return (
    <div className={`min-h-screen ${bgColor} flex items-center justify-center p-4 transition-opacity duration-300 ${isAutoAdvancing ? 'opacity-0' : 'opacity-100'}`}>
      {/* Screen 1: Intro */}
      {currentScreen === 'intro' && (
        <div className="w-full max-w-md space-y-8 text-center">
          <div>
            <div className="text-6xl mb-4">🌍</div>
            <h1 className="text-4xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-3">
              Rate My President
            </h1>
            <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">
              Your daily swipes on global leaders
            </p>
          </div>

          <p className="text-sm text-[oklch(0.75_0.02_250)] opacity-70 leading-relaxed font-['Space_Grotesk']">
            In 20 seconds, you'll have swiped on two leaders. One from home. One from anywhere.
          </p>

          <button
            onClick={handleAdvanceScreen}
            className="w-full py-3 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity"
          >
            Let's go
          </button>
        </div>
      )}

      {/* Screen 2: Mechanic - Home Card */}
      {currentScreen === 'mechanic-home' && (
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="text-3xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">
              Your home leader
            </h2>
            <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">
              Swipe on the leader of your country
            </p>
          </div>

          {/* Card mockup */}
          <div className={`${cardColor} rounded-lg p-8 text-center space-y-4`}>
            <div className="w-20 h-20 bg-[oklch(0.28_0.02_250)] rounded-full mx-auto"></div>
            <p className="text-[oklch(0.75_0.02_250)] text-sm font-['Inter']">Your leader here</p>
            <div className="flex justify-center gap-4 text-xl">
              <span>👎</span>
              <span>👍</span>
              <span>⊘</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBackScreen}
              className="flex-1 py-3 bg-transparent border border-[oklch(0.75_0.02_250)] text-[oklch(0.75_0.02_250)] rounded-lg font-semibold font-['Space_Grotesk'] hover:bg-[oklch(0.28_0.02_250)] transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleAdvanceScreen}
              className="flex-1 py-3 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Screen 3: Mechanic - Global Card */}
      {currentScreen === 'mechanic-global' && (
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🌍</div>
            <h2 className="text-3xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">
              A random global leader
            </h2>
            <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">
              Then meet someone from anywhere
            </p>
          </div>

          {/* Card mockup */}
          <div className={`${cardColor} rounded-lg p-8 text-center space-y-4`}>
            <div className="text-2xl mb-2">🇯🇵</div>
            <div className="w-20 h-20 bg-[oklch(0.28_0.02_250)] rounded-full mx-auto"></div>
            <p className="text-[oklch(0.75_0.02_250)] text-sm font-['Inter']">Random leader here</p>
            <div className="flex justify-center gap-4 text-xl">
              <span>👎</span>
              <span>👍</span>
              <span>⊘</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBackScreen}
              className="flex-1 py-3 bg-transparent border border-[oklch(0.75_0.02_250)] text-[oklch(0.75_0.02_250)] rounded-lg font-semibold font-['Space_Grotesk'] hover:bg-[oklch(0.28_0.02_250)] transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleAdvanceScreen}
              className="flex-1 py-3 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Screen 4: Mechanic - Summary */}
      {currentScreen === 'mechanic-summary' && (
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-3">
              One swipe, two perspectives
            </h2>
            <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">
              Every day, you swipe on your leader + a random one from around the world.
            </p>
          </div>

          {/* Side-by-side cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`${cardColor} rounded-lg p-4 text-center space-y-2`}>
              <div className="text-3xl">🏠</div>
              <p className="text-xs text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Home</p>
              <div className="flex justify-center gap-2 text-lg">
                <span>👎</span>
                <span>👍</span>
              </div>
            </div>
            <div className={`${cardColor} rounded-lg p-4 text-center space-y-2`}>
              <div className="text-3xl">🌍</div>
              <p className="text-xs text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Global</p>
              <div className="flex justify-center gap-2 text-lg">
                <span>👎</span>
                <span>👍</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBackScreen}
              className="flex-1 py-3 bg-transparent border border-[oklch(0.75_0.02_250)] text-[oklch(0.75_0.02_250)] rounded-lg font-semibold font-['Space_Grotesk'] hover:bg-[oklch(0.28_0.02_250)] transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleAdvanceScreen}
              className="flex-1 py-3 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity"
            >
              Select your country
            </button>
          </div>
        </div>
      )}

      {/* Screen 5: Country Selection */}
      {currentScreen === 'country-select' && (
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">
              Where are you from?
            </h2>
            <p className="text-sm text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">
              We'll show you your leader first. (You can change this later.)
            </p>
          </div>

          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-[oklch(0.28_0.02_250)] text-[oklch(0.95_0.02_250)] rounded-lg border border-[oklch(0.28_0.02_250)] focus:border-[oklch(0.62_0.18_142)] outline-none transition-colors font-['Space_Grotesk']"
            />
          </div>

          {/* Country list */}
          <div className={`${cardColor} rounded-lg overflow-hidden max-h-64 overflow-y-auto space-y-0`}>
            {filteredCountries.slice(0, 10).map((country) => (
              <button
                key={country.code}
                onClick={() => setSelectedCountry(country)}
                className={`w-full px-4 py-3 text-left transition-colors ${
                  selectedCountry?.code === country.code
                    ? 'bg-[oklch(0.28_0.02_250)]'
                    : 'hover:bg-[oklch(0.28_0.02_250)]'
                } border-b border-[oklch(0.28_0.02_250)] last:border-b-0`}
              >
                <span className="text-xl mr-3">{country.flag}</span>
                <span className="text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] text-sm">
                  {country.name}
                </span>
                {selectedCountry?.code === country.code && (
                  <span className="float-right text-[oklch(0.62_0.18_142)]">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={handleAdvanceScreen}
              disabled={!selectedCountry}
              className={`w-full py-3 rounded-lg font-semibold font-['Space_Grotesk'] transition-all ${
                selectedCountry
                  ? 'bg-[oklch(0.62_0.18_142)] text-white hover:opacity-90'
                  : 'bg-[oklch(0.28_0.02_250)] text-[oklch(0.75_0.02_250)] opacity-50 cursor-not-allowed'
              }`}
            >
              Continue with {selectedCountry?.flag} {selectedCountry?.name}
            </button>
            <button
              onClick={handleSkipCountry}
              className="w-full py-3 bg-transparent border border-[oklch(0.75_0.02_250)] text-[oklch(0.75_0.02_250)] rounded-lg font-semibold font-['Space_Grotesk'] hover:bg-[oklch(0.28_0.02_250)] transition-colors"
            >
              Prefer not to say
            </button>
          </div>
        </div>
      )}

      {/* Screen 6: Confirmation */}
      {currentScreen === 'confirmation' && (
        <div className="w-full max-w-md space-y-8 text-center animate-fade-in">
          {selectedCountry ? (
            <>
              <div>
                <h2 className="text-4xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">
                  Got it!
                </h2>
                <p className="text-xl text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">
                  {selectedCountry.flag} {selectedCountry.name}
                </p>
              </div>

              <div className={`${cardColor} rounded-lg p-6 space-y-3`}>
                <p className="text-sm text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Your head of state</p>
                {selectedCountry.leader && (
                  <p className="text-2xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk']">
                    {selectedCountry.leader}
                  </p>
                )}
              </div>

              <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">
                Your first swipe awaits
              </p>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-4xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">
                  No problem
                </h2>
                <p className="text-xl text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">
                  You'll get Global cards only—for now
                </p>
              </div>

              <p className="text-sm text-[oklch(0.75_0.02_250)] opacity-70 font-['Space_Grotesk']">
                Add your country anytime in settings
              </p>
            </>
          )}

          <button
            onClick={handleComplete}
            className="w-full py-3 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity"
          >
            Start swiping
          </button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
