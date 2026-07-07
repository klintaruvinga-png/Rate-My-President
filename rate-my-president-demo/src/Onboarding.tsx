import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

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
  const screenOrder: OnboardingScreen[] = ['intro', 'mechanic-home', 'mechanic-global', 'mechanic-summary', 'country-select', 'confirmation'];
  const progressPercent = ((screenOrder.indexOf(currentScreen) + 1) / screenOrder.length) * 100;

  useEffect(() => {
    if (!navigator.geolocation || availableCountries.length === 0) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
          const data = await response.json();
          const matchedCountry = availableCountries.find(
            (country) => country.name.toLowerCase() === data.address?.country?.toLowerCase()
          );

          if (matchedCountry) {
            setSelectedCountry(matchedCountry);
          }
        } catch {
          // Reverse geocoding failed; fallback to manual selection.
        }
      },
      () => {
        // Geolocation permission denied or unavailable.
      }
    );
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
    countryButtonRefs.current = [];
  }, [searchQuery]);

  const handleCountrySelection = (country: CountryData) => {
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
    <div className={`min-h-screen ${bgColor} flex items-center justify-center p-4 transition-opacity duration-300 ${isAutoAdvancing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="w-full max-w-md space-y-6">
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
          <div className="w-full space-y-8 text-center">
            <div>
              <div className="text-6xl mb-4">🌍</div>
              <h1 className="text-4xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-3">Rate My President</h1>
              <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Your daily swipes on global leaders</p>
            </div>
            <p className="text-sm text-[oklch(0.75_0.02_250)] opacity-70 leading-relaxed font-['Space_Grotesk']">In 20 seconds, you'll have swiped on two leaders. One from home. One from anywhere.</p>
            <button onClick={handleAdvanceScreen} className="w-full py-3 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity">Let's go</button>
          </div>
        )}

        {currentScreen === 'mechanic-home' && (
          <div className="w-full space-y-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🏠</div>
              <h2 className="text-3xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">Your home leader</h2>
              <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Swipe on the leader of your country</p>
            </div>
            <div className={`${cardColor} rounded-lg p-8 text-center space-y-4`}>
              <div className="w-20 h-20 bg-[oklch(0.28_0.02_250)] rounded-full mx-auto" />
              <p className="text-[oklch(0.75_0.02_250)] text-sm font-['Inter']">Your leader here</p>
              <div className="flex justify-center gap-4 text-xl"><span>👎</span><span>👍</span><span>⊘</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleBackScreen} className="flex-1 py-3 bg-transparent border border-[oklch(0.75_0.02_250)] text-[oklch(0.75_0.02_250)] rounded-lg font-semibold font-['Space_Grotesk'] hover:bg-[oklch(0.28_0.02_250)] transition-colors">Back</button>
              <button onClick={handleAdvanceScreen} className="flex-1 py-3 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity">Next</button>
            </div>
          </div>
        )}

        {currentScreen === 'mechanic-global' && (
          <div className="w-full space-y-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🌍</div>
              <h2 className="text-3xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">A random global leader</h2>
              <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Then meet someone from anywhere</p>
            </div>
            <div className={`${cardColor} rounded-lg p-8 text-center space-y-4`}>
              <div className="text-2xl mb-2">🇯🇵</div>
              <div className="w-20 h-20 bg-[oklch(0.28_0.02_250)] rounded-full mx-auto" />
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
            <div className="grid grid-cols-2 gap-4">
              <div className={`${cardColor} rounded-lg p-4 text-center space-y-2`}>
                <div className="text-3xl">🏠</div>
                <p className="text-xs text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Home</p>
                <div className="flex justify-center gap-2 text-lg"><span>👎</span><span>👍</span></div>
              </div>
              <div className={`${cardColor} rounded-lg p-4 text-center space-y-2`}>
                <div className="text-3xl">🌍</div>
                <p className="text-xs text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Global</p>
                <div className="flex justify-center gap-2 text-lg"><span>👎</span><span>👍</span></div>
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
                  <span className="text-xl mr-3">{country.flag}</span>
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
                  <p className="text-xl text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">{selectedCountry.flag} {selectedCountry.name}</p>
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
      </div>
    </div>
  );
};

export default Onboarding;
