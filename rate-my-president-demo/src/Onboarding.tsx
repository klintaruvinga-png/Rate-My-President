import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  GlobeIcon,
  HomeIcon,
  LikeIcon,
  NoLikeIcon,
  SkipIcon,
  MapPinIcon,
  TrendUpIcon,
  TrendDownIcon,
} from '@root/Icons';
import AnimatedFlag from '@root/AnimatedFlag';
import SwipeTutorial from './SwipeTutorial';
import { setUserCountry, setCountryLock, isCountryLocked, getCountryLockUntil } from './onboardingStorage';
import type { CardData } from './SwipeCard.types';

export type OnboardingScreen = 'intro' | 'mechanic-home' | 'mechanic-global' | 'mechanic-summary' | 'country-select' | 'confirmation' | 'international-only';
type LocationStatus = 'idle' | 'requesting' | 'success' | 'error';

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
  /** Pre-populate the country picker from a previously saved selection */
  defaultCountryCode?: string | null;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  onComplete,
  onSkip: _onSkip,
  availableCountries = [],
  defaultCountryCode,
}) => {
  const [currentScreen, setCurrentScreen] = useState<OnboardingScreen>('intro');

  // Seed selected country from default if provided
  const defaultCountry = defaultCountryCode
    ? availableCountries.find((c) => c.code === defaultCountryCode) ?? null
    : null;

  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(defaultCountry);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [showLocationErrorPopup, setShowLocationErrorPopup] = useState(false);
  const [showLocationConsentDialog, setShowLocationConsentDialog] = useState(false);
  const [locationConsent, setLocationConsent] = useState<boolean | null>(null);
  const [locationRetryToken, setLocationRetryToken] = useState(0);
  const [focusedCountryIndex, setFocusedCountryIndex] = useState(0);
  // When true, hide the search UI and show the selected-country preview card
  const [countryConfirmed, setCountryConfirmed] = useState<boolean>(defaultCountry !== null);
  const [showCountryLockMessage, setShowCountryLockMessage] = useState(false);

  const countryButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const userMadeExplicitChoice = useRef(defaultCountry !== null);
  const locationConsentHandled = useRef(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const consentDialogRef = useRef<HTMLDivElement>(null);
  const isGeolocationInProgress = useRef(false);
  const geolocationTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const screenOrder: OnboardingScreen[] = ['intro', 'mechanic-home', 'mechanic-global', 'mechanic-summary', 'country-select', 'confirmation', 'international-only'];
  const progressPercent = ((screenOrder.indexOf(currentScreen) + 1) / screenOrder.length) * 100;

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
        handleLocationConsent(false);
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
    if (currentScreen !== 'country-select') return;
    if (!navigator.geolocation || availableCountries.length === 0) return;
    if (locationConsent !== null || userMadeExplicitChoice.current) return;

    // Check if country is locked and show message instead of allowing changes
    if (isCountryLocked()) {
      setShowCountryLockMessage(true);
      return;
    }

    // Show consent dialog after a short delay to let user read the screen first
    const delayId = window.setTimeout(() => {
      if (!userMadeExplicitChoice.current && !locationConsentHandled.current) {
        setShowLocationConsentDialog(true);
      }
    }, 500);

    return () => clearTimeout(delayId);
  }, [availableCountries, currentScreen, locationRetryToken]);

  // Trigger geolocation only after user explicitly consents
  useEffect(() => {
    if (locationConsent !== true) return;
    if (currentScreen !== 'country-select') return;
    if (!navigator.geolocation || availableCountries.length === 0) return;
    if (isGeolocationInProgress.current) return;
    if (userMadeExplicitChoice.current) return;

    const abortController = new AbortController();
    let isCancelled = false;
    isGeolocationInProgress.current = true;

    geolocationTimeoutId.current = setTimeout(() => {
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
          const countryCode = data.address?.country_code?.toUpperCase();
          const matchedCountry = availableCountries.find(
            (country) => country.code.toUpperCase() === countryCode?.toUpperCase()
          );

          if (!isCancelled && !abortController.signal.aborted && !userMadeExplicitChoice.current) {
            if (matchedCountry) {
              if (geolocationTimeoutId.current) clearTimeout(geolocationTimeoutId.current);
              setSelectedCountry(matchedCountry);
              setCountryConfirmed(true);
              userMadeExplicitChoice.current = true;
              setLocationStatus('success');
              setCurrentScreen('confirmation');
            } else {
              if (geolocationTimeoutId.current) clearTimeout(geolocationTimeoutId.current);
              setLocationStatus('success');
            }
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
  }, [locationConsent, availableCountries, currentScreen]);

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

  const handleComplete = () => {
    if (isAutoAdvancing) return;

    setUserCountry(selectedCountry?.code || null);
    
    // Set 24-hour country lock if user selected a country
    if (selectedCountry) {
      setCountryLock();
    }
    
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
    setCountryConfirmed(true);
  };

  const handleClearCountry = () => {
    setCountryConfirmed(false);
    setSelectedCountry(null);
    setSearchQuery('');
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

  // Helper to build presidential card data from selected country
  const buildPresidentialCard = (country: CountryData): CardData => {
    const avatarUrl = country.avatarUrl ?? `https://api.dicebear.com/7.x/initials/svg?seed=${country.avatarSeed ?? country.code}&backgroundColor=${country.avatarColor ?? '2f4f4f'}`;
    const today = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    
    return {
      id: `home-${country.code}-${Date.now()}`,
      type: 'home',
      countryCode: country.code,
      countryName: country.name,
      countryFlag: country.flag,
      leaderName: country.leader ?? country.name,
      avatarUrl: avatarUrl,
      headerImageUrl: avatarUrl,
      approvalPercent: Math.floor(Math.random() * 100),
      trend: ['up', 'down', 'neutral'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'neutral',
      headlines: [
        {
          title: `${country.leader ?? country.name} addresses the nation`,
          source: 'Reuters',
          date: today,
          url: 'https://reuters.com',
        },
      ],
      yesterdayVote: undefined,
    };
  };

  return (
    <>
      <div
        className={`flex-1 min-h-0 overflow-y-auto ${bgColor} flex flex-col items-center justify-center transition-opacity duration-300 ${isAutoAdvancing ? 'opacity-0' : 'opacity-100'}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-full max-w-2xl space-y-4 px-2 py-2 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-6">
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
          <div className="w-full space-y-4 text-center sm:space-y-5">
            <div className="space-y-2">
              <h1 className="mb-2 text-2xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] sm:mb-2 sm:text-2xl sm:text-3xl sm:text-4xl">Rate My President</h1>
              <p className="text-sm text-[oklch(0.75_0.02_250)] font-['Space_Grotesk'] leading-snug sm:text-sm sm:text-base sm:text-lg">Set up two daily swipes. One from your home country. One from anywhere.</p>
              <p className="text-xs text-[oklch(0.72_0.15_65)] font-['Space_Grotesk'] leading-snug sm:text-xs sm:text-sm">You can skip home swipes later.</p>
            </div>
            <SwipeTutorial />
            <button onClick={handleAdvanceScreen} className="min-h-11 w-full rounded-xl bg-[oklch(0.62_0.18_142)] px-4 py-2.5 font-semibold font-['Space_Grotesk'] text-white transition-colors hover:opacity-90 sm:min-h-11 sm:px-4 sm:py-2.5 sm:min-h-12 sm:py-3">Start</button>
          </div>
        )}

        {currentScreen === 'mechanic-home' && (
          <div className="w-full space-y-5 text-center">
            <div className="space-y-1">
              <h2 className="mb-2 text-2xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] sm:text-3xl">Swipe 1: Your home leader</h2>
              <p className="text-base text-[oklch(0.75_0.02_250)] font-['Space_Grotesk'] sm:text-lg">Rate the leader of your country.</p>
              <p className="text-xs text-[oklch(0.72_0.15_65)] font-['Space_Grotesk']">You can skip home swipes later.</p>
            </div>
            <div className={`${cardColor} rounded-2xl p-5 text-center space-y-4 sm:p-6`}>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[oklch(0.28_0.02_250)]">
                <HomeIcon aria-label="Home" className="h-10 w-10 text-[oklch(0.95_0.02_250)]" />
              </div>
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
              <button onClick={handleBackScreen} className="flex-1 min-h-12 rounded-xl border border-[oklch(0.75_0.02_250)] bg-transparent px-4 py-3 font-semibold font-['Space_Grotesk'] text-[oklch(0.75_0.02_250)] transition-colors hover:bg-[oklch(0.28_0.02_250)]">Back</button>
              <button onClick={handleAdvanceScreen} className="flex-1 min-h-12 rounded-xl bg-[oklch(0.62_0.18_142)] px-4 py-3 font-semibold font-['Space_Grotesk'] text-white transition-colors hover:opacity-90">Next</button>
            </div>
          </div>
        )}

        {currentScreen === 'mechanic-global' && (
          <div className="w-full space-y-5 text-center">
            <div className="space-y-1">
              <h2 className="mb-2 text-2xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] sm:text-3xl">Swipe 2: A random global leader</h2>
              <p className="text-base text-[oklch(0.75_0.02_250)] font-['Space_Grotesk'] sm:text-lg">Then rate a leader from anywhere in the world.</p>
            </div>
            <div className={`${cardColor} rounded-2xl p-5 text-center space-y-4 sm:p-6`}>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[oklch(0.28_0.02_250)]">
                <GlobeIcon aria-label="Global" className="h-10 w-10 text-[oklch(0.95_0.02_250)]" />
              </div>
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
              <button onClick={handleBackScreen} className="flex-1 min-h-12 rounded-xl border border-[oklch(0.75_0.02_250)] bg-transparent px-4 py-3 font-semibold font-['Space_Grotesk'] text-[oklch(0.75_0.02_250)] transition-colors hover:bg-[oklch(0.28_0.02_250)]">Back</button>
              <button onClick={handleAdvanceScreen} className="flex-1 min-h-12 rounded-xl bg-[oklch(0.62_0.18_142)] px-4 py-3 font-semibold font-['Space_Grotesk'] text-white transition-colors hover:opacity-90">Next</button>
            </div>
          </div>
        )}

        {currentScreen === 'mechanic-summary' && (
          <div className="w-full space-y-5 text-center">
            <div className="space-y-1">
              <h2 className="mb-2 text-2xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] sm:text-3xl">Your daily swipes</h2>
              <p className="text-base text-[oklch(0.75_0.02_250)] font-['Space_Grotesk'] sm:text-lg">Two leaders. One from home. One from anywhere.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className={`${cardColor} rounded-lg p-4 text-center space-y-2`}>
                <div className="text-3xl inline-block w-10 h-10"><HomeIcon aria-label="Home" /></div>
                <p className="text-xs text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Home</p>
                <div className="flex justify-center gap-2 text-lg"><span className="inline-block w-5 h-5" aria-hidden="true"><NoLikeIcon className="w-full h-full" /></span><span className="inline-block w-5 h-5" aria-hidden="true"><LikeIcon className="w-full h-full" /></span></div>
              </div>
              <div className={`${cardColor} rounded-lg p-4 text-center space-y-2`}>
                <div className="text-3xl inline-block w-10 h-10"><GlobeIcon aria-label="Global" /></div>
                <p className="text-xs text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Global</p>
                <div className="flex justify-center gap-2 text-lg"><span className="inline-block w-5 h-5" aria-hidden="true"><NoLikeIcon className="w-full h-full" /></span><span className="inline-block w-5 h-5" aria-hidden="true"><LikeIcon className="w-full h-full" /></span></div>
              </div>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-xs text-[oklch(0.72_0.15_65)] font-['Space_Grotesk']">You can skip home swipes later.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleBackScreen} className="flex-1 min-h-12 rounded-xl border border-[oklch(0.75_0.02_250)] bg-transparent px-4 py-3 font-semibold font-['Space_Grotesk'] text-[oklch(0.75_0.02_250)] transition-colors hover:bg-[oklch(0.28_0.02_250)]">Back</button>
              <button onClick={handleAdvanceScreen} className="flex-1 min-h-12 rounded-xl bg-[oklch(0.62_0.18_142)] px-4 py-3 font-semibold font-['Space_Grotesk'] text-white transition-colors hover:opacity-90">Select your country</button>
            </div>
          </div>
        )}

        {currentScreen === 'country-select' && (
          <div className="w-full space-y-5 text-center">
            {showCountryLockMessage ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="mb-2 text-2xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk']">Country selection locked</h2>
                  <p className="text-sm text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">You can change your country selection once every 24 hours to prevent abuse of the daily swipe system.</p>
                </div>
                <div className="bg-[oklch(0.20_0.02_250)] rounded-xl p-4 border border-[oklch(0.28_0.02_250)]">
                  <p className="text-xs text-[oklch(0.75_0.02_250)] font-['Inter']">
                    {(() => {
                      const lockUntil = getCountryLockUntil();
                      const hoursLeft = lockUntil ? Math.ceil((lockUntil - Date.now()) / (1000 * 60 * 60)) : 0;
                      return `You can change your country in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
                    })()}
                  </p>
                </div>
                <button
                  onClick={() => setCurrentScreen('international-only')}
                  className="min-h-12 w-full rounded-xl border border-[oklch(0.75_0.02_250)] bg-transparent px-4 py-3 font-semibold font-['Space_Grotesk'] text-[oklch(0.75_0.02_250)] transition-colors hover:bg-[oklch(0.28_0.02_250)]"
                >
                  Continue with current settings
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <h2 className="mb-2 text-2xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk']">Where are you from?</h2>
                  <p className="text-sm text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">We will show your home leader first. <span className="text-[oklch(0.72_0.15_65)]">You can also skip that and use global cards only.</span></p>
                  <p className="text-xs text-[oklch(0.75_0.02_250)] opacity-60 font-['Space_Grotesk']">We use your location to pick your country. We send your coordinates to Nominatim, an OpenStreetMap service, to detect your country.</p>
                </div>

                {/* ── Selected-country preview card ── */}
                {countryConfirmed && selectedCountry ? (
                  <div className="flex items-center gap-4 rounded-2xl border border-[oklch(0.62_0.18_142_/_0.4)] bg-[oklch(0.20_0.02_250)] p-4 shadow-[0_0_24px_oklch(0.62_0.18_142/0.15)] sm:p-5">
                    <div className="flex-shrink-0">
                      <AnimatedFlag countryCode={selectedCountry.code} fallbackFlag={selectedCountry.flag} className="w-14 h-14" />
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
                  <>
                    {locationStatus === 'requesting' ? (
                      <div className="p-3 rounded-lg bg-[oklch(0.20_0.02_250)] text-[oklch(0.95_0.02_250)] space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-[oklch(0.62_0.18_142)] border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-sm font-semibold">Detecting location…</p>
                        </div>
                      </div>
                    ) : null}
                    <div className="relative">
                      <label htmlFor="country-search" className="sr-only">Search countries</label>
                      <input
                        id="country-search"
                        type="text"
                        placeholder="Search countries..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-[oklch(0.28_0.02_250)] bg-[oklch(0.28_0.02_250)] px-4 py-3 font-['Space_Grotesk'] text-[oklch(0.95_0.02_250)] outline-none transition-colors focus:border-[oklch(0.62_0.18_142)]"
                      />
                    </div>
                    <div className={`${cardColor} max-h-[min(35vh,240px)] sm:max-h-[min(45vh,320px)] overflow-hidden overflow-y-auto rounded-2xl`} role="listbox" aria-label="Country list">
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
                  </>
                )}

                <div className="space-y-2">
                  <button
                    onClick={handleAdvanceScreen}
                    disabled={!selectedCountry}
                    className={`min-h-12 w-full rounded-xl px-4 py-3 font-semibold font-['Space_Grotesk'] transition-all ${selectedCountry ? 'bg-[oklch(0.62_0.18_142)] text-white hover:opacity-90' : 'cursor-not-allowed bg-[oklch(0.28_0.02_250)] text-[oklch(0.75_0.02_250)] opacity-50'}`}
                  >
                    Continue with {selectedCountry?.flag} {selectedCountry?.name || '...'}
                  </button>
                  <button
                    onClick={handleSkipCountry}
                    className="min-h-12 w-full rounded-xl border border-[oklch(0.75_0.02_250)] bg-transparent px-4 py-3 font-semibold font-['Space_Grotesk'] text-[oklch(0.75_0.02_250)] transition-colors hover:bg-[oklch(0.28_0.02_250)]"
                  >
                    Prefer not to say
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {currentScreen === 'confirmation' && (
          <div className="w-full space-y-5 text-center animate-fade-in">
            {selectedCountry ? (
              <>
                <div className="space-y-1">
                  <h2 className="text-4xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">Got it!</h2>
                  <div className="text-xl text-[oklch(0.75_0.02_250)] font-['Space_Grotesk'] flex items-center justify-center gap-2">
                    <AnimatedFlag countryCode={selectedCountry.code} fallbackFlag={selectedCountry.flag} className="w-8 h-8" />
                    {selectedCountry.name}
                  </div>
                </div>
                
                {/* Presidential Card Preview */}
                <div className={`${cardColor} rounded-2xl overflow-hidden shadow-xl`}>
                  {(() => {
                    const cardData = buildPresidentialCard(selectedCountry);
                    const percentColor = cardData.approvalPercent >= 50 ? 'text-[oklch(0.62_0.18_142)]' : 'text-[oklch(0.55_0.20_25)]';
                    const trendColor = cardData.trend === 'up'
                      ? 'text-[oklch(0.62_0.18_142)]'
                      : cardData.trend === 'down'
                        ? 'text-[oklch(0.55_0.20_25)]'
                        : 'text-[oklch(0.75_0.02_250)]';
                    
                    return (
                      <div className="flex flex-col relative overflow-hidden">
                        {/* Header Image */}
                        <div className="relative h-[200px] w-full shrink-0 border-b border-[oklch(0.28_0.02_250)]">
                          <img
                            src={cardData.headerImageUrl}
                            alt={cardData.leaderName}
                            className="w-full h-full object-cover"
                            onError={(event) => {
                              const fallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="%230f172a"/><circle cx="60" cy="50" r="24" fill="%23e2e8f0"/><path d="M28 104c8-18 24-26 32-26s24 8 32 26" fill="%23e2e8f0"/></svg>';
                              (event.currentTarget as HTMLImageElement).src = fallback;
                            }}
                          />
                          
                          {/* Top Left: Home Icon Badge */}
                          <div className="absolute top-3 left-3 w-4 h-4 text-[oklch(0.75_0.02_250)]">
                            <HomeIcon aria-label="Home" />
                          </div>

                          {/* Top Right: Country Badge */}
                          <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-2 py-1 flex items-center gap-1.5">
                            <AnimatedFlag countryCode={cardData.countryCode} fallbackFlag={cardData.countryFlag} className="w-4 h-4" />
                            <span className="text-white text-xs font-medium font-['Inter']">{cardData.countryName}</span>
                          </div>

                          {/* Overlay Information */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent px-3 pb-3 pt-8">
                            <h2 className="mb-1 text-lg font-bold leading-snug text-white font-['Space_Grotesk'] drop-shadow-lg">
                              {cardData.leaderName}
                            </h2>
                          </div>
                        </div>

                        {/* Stats Section */}
                        <div className="px-4 py-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-[oklch(0.75_0.02_250)] font-['Space_Grotesk'] uppercase tracking-wider">Approval</p>
                              <p className={`text-2xl font-bold font-['Inter'] ${percentColor}`}>
                                {cardData.approvalPercent}%
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {cardData.trend === 'up' && <TrendUpIcon className={`w-5 h-5 ${trendColor}`} />}
                              {cardData.trend === 'down' && <TrendDownIcon className={`w-5 h-5 ${trendColor}`} />}
                              <span className={`text-sm font-medium font-['Inter'] ${trendColor}`}>
                                {cardData.trend === 'up' ? 'Rising' : cardData.trend === 'down' ? 'Falling' : 'Stable'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                <p className="text-lg text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">Your first swipe awaits</p>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="text-6xl mb-4 inline-block w-16 h-16">
                    <MapPinIcon aria-label="Location" />
                  </div>
                  <h2 className="text-4xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] mb-2">No problem</h2>
                  <p className="text-xl text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">You will see global cards for now.</p>
                </div>
                <p className="text-sm text-[oklch(0.75_0.02_220)] opacity-70 font-['Space_Grotesk']">You can change your choice anytime by rerunning the onboarding</p>
              </>
            )}
            <button onClick={handleComplete} className="min-h-12 w-full rounded-xl bg-[oklch(0.62_0.18_142)] px-4 py-3 font-semibold font-['Space_Grotesk'] text-white transition-colors hover:opacity-90">Start swiping</button>
          </div>
        )}

        {currentScreen === 'international-only' && (
          <div className="w-full space-y-5 text-center">
            <div className="space-y-1">
              <h2 className="mb-2 text-2xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk'] sm:text-3xl">No problem</h2>
              <p className="text-base text-[oklch(0.75_0.02_250)] font-['Space_Grotesk'] sm:text-lg">You will see global cards for now.</p>
            </div>
            <p className="text-sm text-[oklch(0.75_0.02_250)] opacity-70 font-['Space_Grotesk']">You can change your choice anytime by rerunning the onboarding</p>
            <div className="flex gap-3">
              <button
                onClick={handleBackScreen}
                className="flex-1 min-h-12 rounded-xl border border-[oklch(0.75_0.02_250)] bg-transparent px-4 py-3 font-semibold font-['Space_Grotesk'] text-[oklch(0.75_0.02_250)] transition-colors hover:bg-[oklch(0.28_0.02_250)]"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 min-h-12 rounded-xl bg-[oklch(0.62_0.18_142)] px-4 py-3 font-semibold font-['Space_Grotesk'] text-white transition-colors hover:opacity-90"
              >
                Start swiping
              </button>
            </div>
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
                We can detect your country automatically. We send your coordinates to <strong>Nominatim (OpenStreetMap)</strong> to determine your location.
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
                This can happen when location access is denied, the request times out, or the network fails. You can still pick your country manually or skip for now.
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
              </div>
              <button
                onClick={() => {
                  setShowLocationErrorPopup(false);
                  setCurrentScreen('international-only');
                }}
                className="w-full mt-2 py-2.5 text-sm text-[oklch(0.75_0.02_250)] opacity-70 font-['Space_Grotesk'] hover:opacity-100 transition-opacity"
              >
                Do this later
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default Onboarding;
