import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  GlobeIcon,
  HomeIcon,
  ApproveIcon,
  DisapproveIcon,
  SkipIcon,
} from './Icons';
import AnimatedFlag from './AnimatedFlag';
import NewsTicker from './NewsTicker';
import SwipeTutorial from './SwipeTutorial';

export type OnboardingScreen = 'intro' | 'mechanic-home' | 'mechanic-global' | 'mechanic-summary' | 'country-select' | 'confirmation';

export interface CountryData {
  code: string;
  name: string;
  flag: string;
  leader?: string;
}

export interface OnboardingProps {
  onComplete: (countryCode: string | null) => void;
  onSkip?: () => void;
  availableCountries: CountryData[];
}

export const Onboarding: React.FC<OnboardingProps> = ({
  onComplete,
  onSkip: _onSkip,
  availableCountries = [],
}) => {
  const [currentScreen, setCurrentScreen] = useState<OnboardingScreen>('intro');
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [focusedCountryIndex, setFocusedCountryIndex] = useState(0);

  const countryButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const userMadeExplicitChoice = useRef(false);
  const [locationConsent, setLocationConsent] = useState<boolean | null>(null);
  const screenOrder: OnboardingScreen[] = ['intro', 'mechanic-home', 'mechanic-global', 'mechanic-summary', 'country-select', 'confirmation'];
  const progressPercent = ((screenOrder.indexOf(currentScreen) + 1) / screenOrder.length) * 100;
  const welcomeTickerText =
    'Welcome to rate my President! 🌸 Swipe Right to Like! ❤️ Left To No Like! ❌ Its just like Minder! 😉';

  // Only attempt geolocation & reverse-geocoding after explicit user consent.
  useEffect(() => {
    if (locationConsent !== true) return;
    if (!navigator.geolocation || availableCountries.length === 0) return;

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 8000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`,
            {
              signal: abortController.signal,
              // Nominatim public endpoint prefers a Referer or contact header for polite usage; callers should supply a production provider instead.
            }
          );
          const data = await response.json();
          const countryCode = data.address?.country_code?.toLowerCase();
          const matchedCountry = availableCountries.find(
            (country) => country.code.toLowerCase() === countryCode
          );

          if (matchedCountry && !userMadeExplicitChoice.current) {
            setSelectedCountry(matchedCountry);
          }
        } catch {
          // Reverse geocoding failed or was aborted; fallback to manual selection.
        } finally {
          clearTimeout(timeoutId);
        }
      },
      () => {
        // Geolocation permission denied or unavailable.
        clearTimeout(timeoutId);
      },
      { timeout: 8000 }
    );

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [availableCountries, locationConsent]);

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
    userMadeExplicitChoice.current = true;
    setSelectedCountry(null);
    setCurrentScreen('confirmation');
  };

  const handleComplete = () => {
    setIsAutoAdvancing(true);
    setTimeout(() => {
      onComplete(selectedCountry?.code || null);
    }, 300);
  };

  const filteredCountries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return availableCountries.filter((country) => {
      if (!query) return true;
      return country.name.toLowerCase().includes(query) || country.code.toLowerCase().includes(query);
    });
  }, [availableCountries, searchQuery]);

  const visibleCountries = filteredCountries.slice(0, 10);

  useEffect(() => {
    setFocusedCountryIndex(0);
  }, [searchQuery]);

  const handleCountrySelection = (country: CountryData) => {
    userMadeExplicitChoice.current = true;
    setSelectedCountry(country);
  };

  const handleCountryKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!visibleCountries.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = (index + 1) % visibleCountries.length;
      setFocusedCountryIndex(nextIndex);
      countryButtonRefs.current[nextIndex]?.focus();
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = (index - 1 + visibleCountries.length) % visibleCountries.length;
      setFocusedCountryIndex(prevIndex);
      countryButtonRefs.current[prevIndex]?.focus();
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCountrySelection(visibleCountries[index]);
    }
  };

  const bgColor = 'bg-[oklch(0.15_0.04_250)]';
  const cardColor = 'bg-[oklch(0.20_0.02_250)]';

  return (
    <div className={`min-h-full ${bgColor} flex items-start justify-center transition-opacity duration-300 ${isAutoAdvancing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="w-full max-w-md">
        {/* Full-width ticker bar — matches swipe page exactly */}
        <NewsTicker />

        <div className="space-y-4 p-4 pr-8">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[oklch(0.75_0.02_250)]">
              <span>Setup</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 rounded-full bg-[oklch(0.20_0.02_250)]">
              <div className="h-2 rounded-full bg-[oklch(0.62_0.18_142)] transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

        {currentScreen === 'intro' && (
          <div className="w-full space-y-6 text-center">
            <div>
              <h1 className="text-4xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-3">Rate My President</h1>
              <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Your daily swipes on global leaders</p>
            </div>
            <SwipeTutorial />
            <div className="space-y-2">
              <p className="text-sm text-[oklch(0.75_0.02_250)] opacity-70 leading-relaxed font-['Space_Grotesk']">In 20 seconds, you'll have swiped on two leaders. One from home. One from anywhere.</p>
              <p className="text-xs text-[oklch(0.72_0.15_65)] font-['Space_Grotesk']">You can opt out from home swipes later on this page.</p>
            </div>
            <button onClick={handleAdvanceScreen} className="w-full py-3 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity">Let's go</button>
          </div>
        )}

        {currentScreen === 'mechanic-home' && (
          <div className="w-full space-y-8">
            <div className="text-center space-y-1">
              <h2 className="text-3xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">Swipe 1: Your home leader</h2>
              <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Swipe on the leader of your country.</p>
              <p className="text-xs text-[oklch(0.72_0.15_65)] font-['Space_Grotesk']">You can opt out from home swipes later on this page.</p>
            </div>
            <div className={`${cardColor} rounded-lg p-6 text-center space-y-4`}>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[oklch(0.28_0.02_250)]">
                <HomeIcon aria-label="Home" className="h-10 w-10 text-[oklch(0.95_0.02_250)]" />
              </div>
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
              <button onClick={handleBackScreen} className="flex-1 py-3 bg-transparent border border-[oklch(0.75_0.02_250)] text-[oklch(0.75_0.02_250)] rounded-lg font-semibold font-['Space_Grotesk'] hover:bg-[oklch(0.28_0.02_250)] transition-colors">Back</button>
              <button onClick={handleAdvanceScreen} className="flex-1 py-3 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity">Next</button>
            </div>
          </div>
        )}

        {currentScreen === 'mechanic-global' && (
          <div className="w-full space-y-8">
            <div className="text-center space-y-1">
              <h2 className="text-3xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2 whitespace-nowrap">Swipe 2: A random global leader</h2>
              <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Then meet someone from anywhere in the world.</p>
            </div>
            <div className={`${cardColor} rounded-lg p-6 text-center space-y-4`}>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[oklch(0.28_0.02_250)]">
                <GlobeIcon aria-label="Global" className="h-10 w-10 text-[oklch(0.95_0.02_250)]" />
              </div>
              <p className="text-[oklch(0.75_0.02_250)] text-sm font-['Inter']">Random leader here</p>
              <div className="flex justify-center gap-4 text-xl"><span>👎</span><span>👍</span><span>⊘</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleBackScreen} className="flex-1 py-3 bg-transparent border border-[oklch(0.75_0.02_250)] text-[oklch(0.75_0.02_250)] rounded-lg font-semibold font-['Space_Grotesk'] hover:bg-[oklch(0.28_0.02_250)] transition-colors">Back</button>
              <button onClick={handleAdvanceScreen} className="flex-1 py-3 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity">Next</button>
            </div>
          </div>
        )}

        {currentScreen === 'mechanic-summary' && (
          <div className="w-full space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-3">One swipe, two perspectives</h2>
              <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Every day, you swipe on your leader + a random one from around the world.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 items-stretch">
              <div className={`${cardColor} rounded-lg p-5 flex flex-col items-center justify-between text-center space-y-4`}>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.17_0.02_250)]">
                  <HomeIcon aria-label="Home" className="h-6 w-6 text-[oklch(0.95_0.02_250)]" />
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Home</p>
                <div className="flex justify-center gap-2 text-lg">
                  <span className="inline-block w-5 h-5" aria-hidden="true"><DisapproveIcon /></span>
                  <span className="inline-block w-5 h-5" aria-hidden="true"><ApproveIcon /></span>
                </div>
              </div>
              <div className={`${cardColor} rounded-lg p-5 flex flex-col items-center justify-between text-center space-y-4`}>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.17_0.02_250)]">
                  <GlobeIcon aria-label="Global" className="h-6 w-6 text-[oklch(0.95_0.02_250)]" />
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Global</p>
                <div className="flex justify-center gap-2 text-lg">
                  <span className="inline-block w-5 h-5" aria-hidden="true"><DisapproveIcon /></span>
                  <span className="inline-block w-5 h-5" aria-hidden="true"><ApproveIcon /></span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleBackScreen} className="flex-1 py-3 bg-transparent border border-[oklch(0.75_0.02_250)] text-[oklch(0.75_0.02_250)] rounded-lg font-semibold font-['Space_Grotesk'] hover:bg-[oklch(0.28_0.02_250)] transition-colors">Back</button>
              <button onClick={handleAdvanceScreen} className="flex-1 py-3 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity">Select your country</button>
            </div>
          </div>
        )}

        {currentScreen === 'country-select' && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">Where are you from?</h2>
              <p className="text-sm text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">We'll show you your leader first. (You can change this later.)</p>
            </div>
            {/* Location consent prompt: only show when we haven't asked yet */}
            {locationConsent === null && typeof navigator !== 'undefined' && 'geolocation' in navigator && (
              <div className="p-3 rounded-lg bg-[oklch(0.20_0.02_250)] text-[oklch(0.95_0.02_250)] space-y-2">
                <p className="text-sm">Allow using your location to preselect your country? This sends coordinates to a reverse-geocoding provider.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLocationConsent(true)}
                    className="flex-1 py-2 bg-[oklch(0.62_0.18_142)] text-white rounded-md"
                  >
                    Yes, use my location
                  </button>
                  <button
                    onClick={() => { setLocationConsent(false); userMadeExplicitChoice.current = true; }}
                    className="flex-1 py-2 bg-transparent border border-[oklch(0.75_0.02_250)] rounded-md"
                  >
                    No thanks
                  </button>
                </div>
              </div>
            )}
            <div className="relative">
              <label htmlFor="country-search" className="sr-only">Search countries</label>
              <input
                id="country-search"
                type="text"
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-[oklch(0.28_0.02_250)] text-[oklch(0.95_0.02_250)] rounded-lg border border-[oklch(0.28_0.02_250)] focus:border-[oklch(0.62_0.18_142)] outline-none transition-colors font-['Space_Grotesk']"
              />
            </div>
            {filteredCountries.length > 10 && <p className="text-xs text-[oklch(0.75_0.02_250)]">Showing the first 10 matching countries. Narrow your search for more results.</p>}
            <div className={`${cardColor} rounded-lg overflow-hidden max-h-64 overflow-y-auto`} role="listbox" aria-label="Country list">
              {visibleCountries.map((country, index) => (
                <button
                  key={country.code}
                  ref={(element) => {
                    countryButtonRefs.current[index] = element;
                  }}
                  onClick={() => handleCountrySelection(country)}
                  onKeyDown={(event) => handleCountryKeyDown(event, index)}
                  role="option"
                  aria-selected={selectedCountry?.code === country.code}
                  className={`w-full px-4 py-3 text-left transition-colors ${selectedCountry?.code === country.code ? 'bg-[oklch(0.28_0.02_250)]' : 'hover:bg-[oklch(0.28_0.02_250)]'} border-b border-[oklch(0.28_0.02_250)] last:border-b-0 ${focusedCountryIndex === index ? 'ring-1 ring-[oklch(0.62_0.18_142)]' : ''}`}
                >
                  <AnimatedFlag countryCode={country.code} fallbackFlag={country.flag} className="w-6 h-6 inline-flex mr-3" />
                  <span className="text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] text-sm">{country.name}</span>
                  {selectedCountry?.code === country.code && <span className="float-right text-[oklch(0.62_0.18_142)]">✓</span>}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <button
                onClick={handleAdvanceScreen}
                disabled={!selectedCountry}
                className={`w-full py-3 rounded-lg font-semibold font-['Space_Grotesk'] transition-all ${selectedCountry ? 'bg-[oklch(0.62_0.18_142)] text-white hover:opacity-90' : 'bg-[oklch(0.28_0.02_250)] text-[oklch(0.75_0.02_250)] opacity-50 cursor-not-allowed'}`}
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

        {currentScreen === 'confirmation' && (
          <div className="w-full space-y-8 text-center animate-fade-in">
            {selectedCountry ? (
              <>
                <div>
                  <h2 className="text-4xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">Got it!</h2>
                  <p className="text-xl text-[oklch(0.75_0.02_250)] font-['Space_Grotesk'] flex items-center justify-center gap-2">
                    <AnimatedFlag countryCode={selectedCountry.code} fallbackFlag={selectedCountry.flag} className="w-8 h-8" />
                    {selectedCountry.name}
                  </p>
                </div>
                <div className={`${cardColor} rounded-lg p-6 space-y-3`}>
                  <p className="text-sm text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Your head of state</p>
                  {selectedCountry.leader && <p className="text-2xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk']">{selectedCountry.leader}</p>}
                </div>
                <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Your first swipe awaits</p>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-4xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">No problem</h2>
                  <p className="text-xl text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">You'll get Global cards only—for now</p>
                </div>
                <p className="text-sm text-[oklch(0.75_0.02_250)] opacity-70 font-['Space_Grotesk']">Add your country anytime in settings</p>
              </>
            )}
            <button onClick={handleComplete} className="w-full py-3 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity">Start swiping</button>
          </div>
        )}
        </div>{/* /space-y-4 p-4 pr-8 */}
      </div>
    </div>
  );
};

export default Onboarding;
