import React, { useState, useEffect, useRef } from 'react';
import { GlobeIcon, HomeIcon, ApproveIcon, DisapproveIcon, SkipIcon, CountryIcon, BadgeIcon } from './Icons';
import AnimatedFlag from './AnimatedFlag';

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
  /** Pre-populate the country picker from a previously saved selection */
  defaultCountryCode?: string | null;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  onComplete,
  onSkip,
  availableCountries = [],
  defaultCountryCode,
}) => {
  const [currentScreen, setCurrentScreen] = useState<OnboardingScreen>('intro');

  const defaultCountry = defaultCountryCode
    ? availableCountries.find((c) => c.code === defaultCountryCode) ?? null
    : null;

  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(defaultCountry);
  const [searchQuery, setSearchQuery] = useState('');
  const [detectedCountry, setDetectedCountry] = useState<CountryData | null>(null);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [locationConsent, setLocationConsent] = useState<boolean | null>(null);
  const userMadeExplicitChoice = useRef(defaultCountry !== null);
  // When true, hide the search UI and show the selected-country preview card
  const [countryConfirmed, setCountryConfirmed] = useState<boolean>(defaultCountry !== null);

  // Detect user's geolocation only after explicit consent and with cleanup protection.
  useEffect(() => {
    if (defaultCountry || locationConsent !== true) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation || availableCountries.length === 0) return;

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => abortController.abort(), 8000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (abortController.signal.aborted) return;

        // TODO: Implement reverse geocoding to convert position.coords.latitude/longitude to country code.
        // For now, we fall back to the first available country as this demo lacks a geocoding service.
        const fallback = availableCountries[0];
        if (!userMadeExplicitChoice.current) {
          setDetectedCountry(fallback);
          setSelectedCountry(fallback);
          setCountryConfirmed(true);
          userMadeExplicitChoice.current = true;
        }
      },
      () => {
        if (!abortController.signal.aborted) {
          console.log('Geolocation permission denied or unavailable');
        }
      },
      { timeout: 8000 }
    );

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [availableCountries, defaultCountry, locationConsent]);

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
    setCountryConfirmed(false);
    setCurrentScreen('confirmation');
  };

  const handleClearCountry = () => {
    setCountryConfirmed(false);
    setSelectedCountry(null);
    setSearchQuery('');
    setLocationConsent(null);
    userMadeExplicitChoice.current = false;
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
            <div className="text-6xl mb-4 inline-block w-16 h-16">
              <GlobeIcon aria-label="Global" />
            </div>
            <h1 className="text-4xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-3">
              Rate My President
            </h1>
            <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">
              Your daily swipes on global leaders
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-[oklch(0.75_0.02_250)] opacity-70 leading-relaxed font-['Space_Grotesk']">
              In 20 seconds, you'll have swiped on two leaders. One from home. One from anywhere.
            </p>
            <p className="text-xs text-[oklch(0.72_0.15_65)] font-['Space_Grotesk']">
              You can opt out from home swipes later on this page.
            </p>
          </div>

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
            <div className="text-6xl mb-4 inline-block w-16 h-16">
              <HomeIcon aria-label="Home" />
            </div>
            <h2 className="text-3xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">
              Swipe 1: Your home leader
            </h2>
            <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">
              Swipe on the leader of your country.
            </p>
            <p className="text-xs text-[oklch(0.72_0.15_65)] font-['Space_Grotesk']">
              You can opt out from home swipes later on this page.
            </p>
          </div>

          {/* Card mockup */}
          <div className={`${cardColor} rounded-lg p-8 text-center space-y-4`}>
            <div className="w-20 h-20 bg-[oklch(0.28_0.02_250)] rounded-full mx-auto"></div>
            <p className="text-[oklch(0.75_0.02_250)] text-sm font-['Inter']">Your leader here</p>
            <div className="flex justify-center gap-4 text-xl">
              <span className="inline-block w-6 h-6" aria-hidden="true">
                <DisapproveIcon className="w-full h-full" />
              </span>
              <span className="inline-block w-6 h-6" aria-hidden="true">
                <ApproveIcon className="w-full h-full" />
              </span>
              <span className="inline-block w-6 h-6" aria-hidden="true">
                <SkipIcon className="w-full h-full" />
              </span>
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
            <div className="text-6xl mb-4 inline-block w-16 h-16">
              <GlobeIcon aria-label="Global" />
            </div>
            <h2 className="text-3xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">
              A random global leader
            </h2>
            <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">
              Then meet someone from anywhere in the world.
            </p>
          </div>

          {/* Card mockup */}
          <div className={`${cardColor} rounded-lg p-8 text-center space-y-4`}>
            <div className="text-2xl mb-2"><CountryIcon aria-label="Example country" /></div>
            <div className="w-20 h-20 bg-[oklch(0.28_0.02_250)] rounded-full mx-auto"></div>
            <p className="text-[oklch(0.75_0.02_250)] text-sm font-['Inter']">Random leader here</p>
            <div className="flex justify-center gap-4 text-xl">
              <span className="inline-block w-6 h-6" aria-hidden="true">
                <DisapproveIcon className="w-full h-full" />
              </span>
              <span className="inline-block w-6 h-6" aria-hidden="true">
                <ApproveIcon className="w-full h-full" />
              </span>
              <span className="inline-block w-6 h-6" aria-hidden="true">
                <SkipIcon className="w-full h-full" />
              </span>
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
              <div className="text-3xl inline-block w-10 h-10"><HomeIcon aria-label="Home" /></div>
              <p className="text-xs text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Home</p>
              <div className="flex justify-center gap-2 text-lg">
                <span className="inline-block w-5 h-5" aria-hidden="true">
                  <DisapproveIcon className="w-full h-full" />
                </span>
                <span className="inline-block w-5 h-5" aria-hidden="true">
                  <ApproveIcon className="w-full h-full" />
                </span>
              </div>
            </div>
            <div className={`${cardColor} rounded-lg p-4 text-center space-y-2`}>
              <div className="text-3xl inline-block w-10 h-10"><GlobeIcon aria-label="Global" /></div>
              <p className="text-xs text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Global</p>
              <div className="flex justify-center gap-2 text-lg">
                <span className="inline-block w-5 h-5" aria-hidden="true">
                  <DisapproveIcon className="w-full h-full" />
                </span>
                <span className="inline-block w-5 h-5" aria-hidden="true">
                  <ApproveIcon className="w-full h-full" />
                </span>
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

          {/* Search input — only shown when no country is confirmed yet */}
          {countryConfirmed && selectedCountry ? (
            <div className="rounded-xl bg-[oklch(0.20_0.02_250)] border border-[oklch(0.62_0.18_142)/0.4] p-5 flex items-center gap-4 shadow-[0_0_24px_oklch(0.62_0.18_142/0.15)]">
              <div className="flex-shrink-0">
                <AnimatedFlag countryCode={selectedCountry.code} fallbackFlag={selectedCountry.flag} className="w-10 h-10" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-[oklch(0.72_0.15_65)] font-['Space_Grotesk'] mb-0.5">Your home country</p>
                <p className="text-xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] truncate">{selectedCountry.name}</p>
                {selectedCountry.leader && (
                  <p className="text-sm text-[oklch(0.75_0.02_250)] font-['Inter'] mt-0.5 truncate">{selectedCountry.leader}</p>
                )}
              </div>
              <button
                onClick={handleClearCountry}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-[oklch(0.75_0.02_250)/0.4] text-[oklch(0.75_0.02_250)] text-xs font-semibold font-['Space_Grotesk'] hover:border-[oklch(0.95_0.02_250)/0.6] hover:text-[oklch(0.95_0.02_250)] transition-colors"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {locationConsent === null && !defaultCountry && typeof navigator !== 'undefined' && 'geolocation' in navigator && (
                <div className="rounded-xl border border-[oklch(0.62_0.18_142)/0.25] bg-[oklch(0.24_0.02_250)] p-4 text-left">
                  <p className="text-sm font-semibold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk']">Use your location to prefill your country?</p>
                  <p className="mt-1 text-xs text-[oklch(0.75_0.02_250)] font-['Inter']">We can try to match your country once, then you can adjust it manually.</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLocationConsent(true)}
                      className="rounded-lg bg-[oklch(0.62_0.18_142)] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Yes, use location
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocationConsent(false)}
                      className="rounded-lg border border-[oklch(0.75_0.02_250)/0.4] px-3 py-2 text-sm font-semibold text-[oklch(0.75_0.02_250)] transition-colors hover:bg-[oklch(0.28_0.02_250)]"
                    >
                      No thanks
                    </button>
                  </div>
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-[oklch(0.28_0.02_250)] text-[oklch(0.95_0.02_250)] rounded-lg border border-[oklch(0.28_0.02_250)] focus:border-[oklch(0.62_0.18_142)] outline-none transition-colors font-['Space_Grotesk']"
                />
              </div>
            </div>
          )}

          {/* Country list — hidden when a selection is confirmed */}
          {!countryConfirmed && (
            <div className={`${cardColor} rounded-lg overflow-hidden max-h-64 overflow-y-auto space-y-0`}>
            {filteredCountries.slice(0, 10).map((country) => (
                <button
                key={country.code}
                onClick={() => {
                userMadeExplicitChoice.current = true;
                setSelectedCountry(country);
                setCountryConfirmed(true);
              }}
                className={`w-full px-4 py-3 text-left transition-colors ${
                  selectedCountry?.code === country.code
                    ? 'bg-[oklch(0.28_0.02_250)]'
                    : 'hover:bg-[oklch(0.28_0.02_250)]'
                } border-b border-[oklch(0.28_0.02_250)] last:border-b-0`}
              >
                <AnimatedFlag countryCode={country.code} fallbackFlag={country.flag} className="w-6 h-6 inline-flex mr-3" />
                <span className="text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] text-sm">
                  {country.name}
                </span>
                {selectedCountry?.code === country.code && (
                  <BadgeIcon className="inline-block w-4 h-4 float-right text-[oklch(0.62_0.18_142)]" aria-label="Selected" />
                )}
              </button>
            ))}
          </div>
          )}

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
                <p className="text-xl text-[oklch(0.75_0.02_250)] font-['Space_Grotesk'] flex items-center justify-center gap-2">
                  <AnimatedFlag countryCode={selectedCountry.code} fallbackFlag={selectedCountry.flag} className="w-8 h-8" />
                  {selectedCountry.name}
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
