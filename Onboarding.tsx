import React, { useState, useEffect, useRef } from 'react';
import { GlobeIcon, HomeIcon, LikeIcon, NoLikeIcon, SkipIcon, CountryIcon, BadgeIcon } from './Icons';
import AnimatedFlag from './AnimatedFlag';
import { setUserCountry } from './onboardingStorage';

type OnboardingScreen = 'intro' | 'mechanic-home' | 'mechanic-global' | 'mechanic-summary' | 'country-select' | 'confirmation' | 'international-only';
type LocationStatus = 'idle' | 'requesting' | 'success' | 'error';

interface CountryData {
  code: string;
  name: string;
  flag: string;
  leader?: string;
  avatarUrl?: string;
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
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [showLocationErrorPopup, setShowLocationErrorPopup] = useState(false);
  const [showLocationConsentDialog, setShowLocationConsentDialog] = useState(false);
  const [locationConsent, setLocationConsent] = useState<boolean | null>(null);
  const [locationRetryToken, setLocationRetryToken] = useState(0);
  const userMadeExplicitChoice = useRef(defaultCountry !== null);
  const locationConsentHandled = useRef(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const consentDialogRef = useRef<HTMLDivElement>(null);
  const isGeolocationInProgress = useRef(false);
  const geolocationTimeoutId = useRef<NodeJS.Timeout | null>(null);
  // When true, hide the search UI and show the selected-country preview card
  const [countryConfirmed, setCountryConfirmed] = useState<boolean>(defaultCountry !== null);

  // Swipe gesture handling
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
    touchStartY.current = e.changedTouches[0].screenY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    touchEndY.current = e.changedTouches[0].screenY;
    handleSwipe();
  };

  const handleSwipe = () => {
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;

    // Require horizontal gesture with at least 50px and greater than vertical distance
    if (Math.abs(diffX) >= 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        // Swipe left - advance
        handleAdvanceScreen();
      } else {
        // Swipe right - go back
        handleBackScreen();
      }
    }
  };

  // Handle Escape key to close the error popup
  useEffect(() => {
    if (!showLocationErrorPopup) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLocationErrorPopup(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showLocationErrorPopup]);

  // Handle Escape key to close the consent dialog
  useEffect(() => {
    if (!showLocationConsentDialog) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLocationConsentDialog(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showLocationConsentDialog]);

  // Move focus to error popup when it opens
  useEffect(() => {
    if (showLocationErrorPopup && popupRef.current) {
      popupRef.current.focus();
    }
  }, [showLocationErrorPopup]);

  // Move focus to consent dialog when it opens
  useEffect(() => {
    if (showLocationConsentDialog && consentDialogRef.current) {
      consentDialogRef.current.focus();
    }
  }, [showLocationConsentDialog]);

  // Show location consent dialog when entering country-select screen
  // eslint-disable-next-line react-hooks/exhaustive-deps -- locationConsent intentionally omitted to prevent re-showing dialog after consent
  useEffect(() => {
    if (defaultCountry || currentScreen !== 'country-select') return;
    if (typeof navigator === 'undefined' || !navigator.geolocation || availableCountries.length === 0) return;
    if (locationConsent !== null || userMadeExplicitChoice.current) return;

    // Show consent dialog after a short delay to let user read the screen first
    const delayId = window.setTimeout(() => {
      if (!userMadeExplicitChoice.current && !locationConsentHandled.current) {
        setShowLocationConsentDialog(true);
      }
    }, 500);

    return () => clearTimeout(delayId);
  }, [availableCountries, defaultCountry, currentScreen, locationRetryToken]);

  // Trigger geolocation only after user explicitly consents
  useEffect(() => {
    if (locationConsent !== true) return;
    if (currentScreen !== 'country-select') return;
    if (typeof navigator === 'undefined' || !navigator.geolocation || availableCountries.length === 0) return;
    if (isGeolocationInProgress.current) return;
    if (userMadeExplicitChoice.current) return;

    const abortController = new AbortController();
    let isCancelled = false;
    isGeolocationInProgress.current = true;

    geolocationTimeoutId.current = window.setTimeout(() => {
      if (isCancelled) return;
      isCancelled = true;
      abortController.abort();
      setLocationStatus('error');
      setShowLocationErrorPopup(true);
      isGeolocationInProgress.current = false;
    }, 8000);

    setLocationStatus('requesting');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (isCancelled || abortController.signal.aborted) {
          isGeolocationInProgress.current = false;
          return;
        }

        try {
          // TODO: In production, use a server-side proxy or approved provider instead of calling Nominatim directly from the browser
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`,
            { signal: abortController.signal }
          );
          const data = await response.json();
          const countryCode = data?.address?.country_code?.toUpperCase();
          const matchedCountry = availableCountries.find(
            (country) => country.code.toUpperCase() === countryCode
          );

          if (matchedCountry && !isCancelled && !abortController.signal.aborted && !userMadeExplicitChoice.current) {
            if (geolocationTimeoutId.current) clearTimeout(geolocationTimeoutId.current);
            setDetectedCountry(matchedCountry);
            setSelectedCountry(matchedCountry);
            setCountryConfirmed(true);
            userMadeExplicitChoice.current = true;
            setLocationStatus('success');
            setCurrentScreen('confirmation');
          } else {
            if (geolocationTimeoutId.current) clearTimeout(geolocationTimeoutId.current);
            setLocationStatus('success');
          }
        } catch {
          if (isCancelled || abortController.signal.aborted || userMadeExplicitChoice.current) {
            if (geolocationTimeoutId.current) clearTimeout(geolocationTimeoutId.current);
            isGeolocationInProgress.current = false;
            return;
          }
          setLocationStatus('error');
          setShowLocationErrorPopup(true);
          if (geolocationTimeoutId.current) clearTimeout(geolocationTimeoutId.current);
        }
        isGeolocationInProgress.current = false;
      },
      () => {
        if (isCancelled || abortController.signal.aborted || userMadeExplicitChoice.current) {
          if (geolocationTimeoutId.current) clearTimeout(geolocationTimeoutId.current);
          isGeolocationInProgress.current = false;
          return;
        }
        setLocationStatus('error');
        setShowLocationErrorPopup(true);
        if (geolocationTimeoutId.current) clearTimeout(geolocationTimeoutId.current);
        isGeolocationInProgress.current = false;
      },
      { timeout: 8000 }
    );

    return () => {
      isCancelled = true;
      isGeolocationInProgress.current = false;
      if (geolocationTimeoutId.current) clearTimeout(geolocationTimeoutId.current);
      abortController.abort();
    };
  }, [availableCountries, locationConsent, currentScreen]);

  const handleAdvanceScreen = () => {
    if (isAutoAdvancing) return;

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
      case 'international-only':
        handleComplete();
        break;
    }
  };

  const handleBackScreen = () => {
    if (isAutoAdvancing) return;

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
      case 'international-only':
        setCurrentScreen('country-select');
        break;
    }
  };

  const handleSkipCountry = () => {
    userMadeExplicitChoice.current = true;
    setSelectedCountry(null);
    setCountryConfirmed(false);
    setCurrentScreen('confirmation');
  };

  const handleLocationConsent = (consented: boolean) => {
    setLocationConsent(consented);
    setShowLocationConsentDialog(false);
    locationConsentHandled.current = true;
    if (!consented) {
      // Intentionally set userMadeExplicitChoice to permanently block geolocation
      // This respects the user's privacy choice - declining consent is a permanent decision
      userMadeExplicitChoice.current = true;
    }
  };

  const handleClearCountry = () => {
    setCountryConfirmed(false);
    setSelectedCountry(null);
    setSearchQuery('');
  };

  const handleComplete = () => {
    if (isAutoAdvancing) return;

    setUserCountry(selectedCountry?.code || null);
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
    <div
      className={`min-h-screen ${bgColor} flex items-center justify-center p-3 transition-opacity duration-300 sm:p-4 ${isAutoAdvancing ? 'opacity-0' : 'opacity-100'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Screen 1: Intro */}
      {currentScreen === 'intro' && (
        <div className="w-full max-w-md space-y-5 text-center sm:space-y-8">
          <div>
            <div className="text-5xl mb-3 inline-block w-14 h-14 sm:text-6xl sm:mb-4 sm:w-16 sm:h-16">
              <GlobeIcon aria-label="Global" />
            </div>
            <h1 className="text-3xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2 sm:text-4xl sm:mb-3">
              Rate My President
            </h1>
            <p className="text-base text-[oklch(0.75_0.02_250)] font-['Space_Grotesk'] leading-snug sm:text-base sm:text-lg">
              Setup your daily swipes on two leaders. One from home. One from anywhere.
            </p>
            <p className="text-sm text-[oklch(0.72_0.15_65)] font-['Space_Grotesk'] leading-snug sm:text-sm">
              You can opt out from home swipes on later screen.
            </p>
          </div>

          <button
            onClick={handleAdvanceScreen}
            className="w-full py-2.5 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity sm:py-3"
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
                <NoLikeIcon className="w-full h-full" />
              </span>
              <span className="inline-block w-6 h-6" aria-hidden="true">
                <LikeIcon className="w-full h-full" />
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
                <NoLikeIcon className="w-full h-full" />
              </span>
              <span className="inline-block w-6 h-6" aria-hidden="true">
                <LikeIcon className="w-full h-full" />
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
                  <NoLikeIcon className="w-full h-full" />
                </span>
                <span className="inline-block w-5 h-5" aria-hidden="true">
                  <LikeIcon className="w-full h-full" />
                </span>
              </div>
            </div>
            <div className={`${cardColor} rounded-lg p-4 text-center space-y-2`}>
              <div className="text-3xl inline-block w-10 h-10"><GlobeIcon aria-label="Global" /></div>
              <p className="text-xs text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Global</p>
              <div className="flex justify-center gap-2 text-lg">
                <span className="inline-block w-5 h-5" aria-hidden="true">
                  <NoLikeIcon className="w-full h-full" />
                </span>
                <span className="inline-block w-5 h-5" aria-hidden="true">
                  <LikeIcon className="w-full h-full" />
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
              We'll show you your leader first. <span className="text-[oklch(0.72_0.15_65)]">Or skip to Global-only mode</span>
            </p>
            <p className="text-xs text-[oklch(0.75_0.02_250)] opacity-60 font-['Space_Grotesk'] mt-2">
              Your precise coordinates will be sent to Nominatim (OpenStreetMap) to detect your country.
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
                <div className="mt-2 flex items-center gap-3">
                  {selectedCountry.avatarUrl ? (
                    <img
                      src={selectedCountry.avatarUrl}
                      alt={`${selectedCountry.leader ?? selectedCountry.name} avatar`}
                      className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[oklch(0.28_0.02_250)] flex items-center justify-center">
                      <span className="text-2xl">{selectedCountry.flag}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] truncate">{selectedCountry.leader ?? selectedCountry.name}</p>
                    <p className="text-sm text-[oklch(0.75_0.02_250)] font-['Inter'] truncate">{selectedCountry.name}</p>
                  </div>
                </div>
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
              {locationStatus === 'requesting' ? (
                <div className="rounded-xl border border-[oklch(0.62_0.18_142)/0.25] bg-[oklch(0.24_0.02_250)] p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[oklch(0.62_0.18_142)] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk']">Detecting location…</p>
                  </div>
                </div>
              ) : null}
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
              <span className="inline-flex items-center justify-center gap-2">
                <AnimatedFlag
                  countryCode={selectedCountry?.code}
                  fallbackFlag={selectedCountry?.flag}
                  className="w-5 h-5"
                />
                <span>Continue with {selectedCountry?.name || '...'}</span>
              </span>
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

      {/* Screen 7: International Only */}
      {currentScreen === 'international-only' && (
        <div className="w-full max-w-md space-y-8 text-center">
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

          <button
            onClick={handleComplete}
            className="w-full py-3 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity"
          >
            Start swiping
          </button>
        </div>
      )}

      {/* Location Consent Dialog */}
      {showLocationConsentDialog && currentScreen === 'country-select' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            ref={consentDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-consent-title"
            tabIndex={-1}
            className="bg-[oklch(0.20_0.02_250)] rounded-xl p-6 max-w-sm w-full border border-[oklch(0.62_0.18_142)/0.3]"
          >
            <h3 id="location-consent-title" className="text-lg font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-3">
              Use your location?
            </h3>
            <p className="text-sm text-[oklch(0.75_0.02_250)] font-['Inter'] mb-4">
              We can detect your country automatically. Your precise GPS coordinates will be sent to <strong>Nominatim (OpenStreetMap)</strong> to determine your location.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleLocationConsent(true)}
                className="flex-1 py-2.5 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity"
              >
                Yes, use location
              </button>
              <button
                onClick={() => handleLocationConsent(false)}
                className="flex-1 py-2.5 border border-[oklch(0.75_0.02_250)/0.4] text-[oklch(0.75_0.02_250)] rounded-lg font-semibold font-['Space_Grotesk'] hover:bg-[oklch(0.28_0.02_250)] transition-colors"
              >
                No thanks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Error Popup */}
      {showLocationErrorPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            ref={popupRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-error-title"
            tabIndex={-1}
            className="bg-[oklch(0.20_0.02_250)] rounded-xl p-6 max-w-sm w-full border border-[oklch(0.55_0.20_25)/0.25]"
          >
            <h3 id="location-error-title" className="text-lg font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">
              Couldn't detect your location
            </h3>
            <p className="text-sm text-[oklch(0.75_0.02_250)] font-['Inter'] mb-4">
              This could be due to permission denied, timeout, or network issues. You can still select your country manually or skip for now.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowLocationErrorPopup(false);
                  setLocationConsent(null);
                  locationConsentHandled.current = false;
                  setLocationRetryToken(prev => prev + 1);
                }}
                className="flex-1 py-2.5 bg-[oklch(0.62_0.18_142)] text-white rounded-lg font-semibold font-['Space_Grotesk'] hover:opacity-90 transition-opacity"
              >
                Try again
              </button>
              <button
                onClick={() => setShowLocationErrorPopup(false)}
                className="flex-1 py-2.5 border border-[oklch(0.75_0.02_250)/0.4] text-[oklch(0.75_0.02_250)] rounded-lg font-semibold font-['Space_Grotesk'] hover:bg-[oklch(0.28_0.02_250)] transition-colors"
              >
                Manual search
              </button>
              <button
                onClick={() => {
                  setShowLocationErrorPopup(false);
                  setCurrentScreen('international-only');
                }}
                className="flex-1 py-2.5 border border-[oklch(0.75_0.02_250)/0.4] text-[oklch(0.75_0.02_250)] rounded-lg font-semibold font-['Space_Grotesk'] hover:bg-[oklch(0.28_0.02_250)] transition-colors"
              >
                Do this later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
