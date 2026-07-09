import { useState, useEffect, useRef } from 'react';
import './App.css';
import OnboardingDemo from './Onboarding.demo';
import SwipeCardDemo from './SwipeCard.demo';
import LeaderboardDemo from './Leaderboard.demo';
import headerImage from '@root/assets/Obama Header No BG.png';
import NewsTicker from './NewsTicker';
// LeaderTicker not used in this demo shell
import { getHasCompletedOnboarding, setHasCompletedOnboarding, setUserCountry } from './onboardingStorage';
import { availableCountries } from './countries';
import { preloadFlags } from './flagPreloader';

function App() {
  const [activeTab, setActiveTab] = useState<'swipe' | 'onboarding' | 'leaderboard'>(() => {
    if (typeof window === 'undefined') {
      return 'onboarding';
    }

    return getHasCompletedOnboarding() ? 'swipe' : 'onboarding';
  });
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const helpCloseButtonRef = useRef<HTMLButtonElement | null>(null);

  // Warm the browser HTTP cache for all flag images immediately on app boot.
  // This ensures flags are ready before SwipeCard mounts after onboarding.
  useEffect(() => {
    preloadFlags(availableCountries.map((c) => c.code));
  }, []);

  useEffect(() => {
    if (!showHelpTooltip) return;

    const previouslyFocusedElement = document.activeElement as HTMLElement | null;
    helpCloseButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowHelpTooltip(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [showHelpTooltip]);

  const handleOnboardingComplete = (countryCode: string | null) => {
    setHasCompletedOnboarding(true);
    // Persist (or clear) the home country so the swipe stack shows it immediately
    setUserCountry(countryCode);
    setActiveTab('swipe');
  };

  const handleTabChange = (tab: 'swipe' | 'onboarding' | 'leaderboard') => {
    setActiveTab(tab);
  };

  return (
    <div className={`bg-[oklch(0.15_0.04_250)] min-h-screen text-[oklch(0.95_0.02_250)] flex flex-col ${showHelpTooltip ? 'overflow-hidden' : ''}`}>
      {/* Premium Navigation Header */}
      <header className="relative border-b border-[oklch(0.28_0.02_250)] bg-[oklch(0.18_0.03_250)] px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-50 shadow-md">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={headerImage} alt="Rate My President mascot" className="h-[90px] w-[90px] rounded-2xl bg-white/10 p-2 shadow-sm" />
            <div>
              <h1 className="text-xl font-bold font-['Space_Grotesk'] tracking-tight">Rate My President</h1>
              <span className="text-xs text-[oklch(0.72_0.15_65)] font-semibold uppercase tracking-widest font-['Space_Grotesk']">Playground</span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[oklch(0.28_0.02_250)] bg-[oklch(0.18_0.03_250)] text-[oklch(0.75_0.02_250)] transition-colors hover:bg-[oklch(0.22_0.02_250)] sm:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="text-lg">☰</span>
          </button>

        </div>

        <nav className="hidden flex-wrap gap-2 items-center sm:flex sm:flex-nowrap sm:justify-end sm:pr-8">
          <button
            onClick={() => handleTabChange('onboarding')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold font-['Space_Grotesk'] whitespace-nowrap transition-all ${
              activeTab === 'onboarding'
                ? 'bg-[oklch(0.28_0.02_250)] text-white shadow'
                : 'text-[oklch(0.75_0.02_250)] hover:text-white hover:bg-[oklch(0.22_0.02_250)]'
            }`}
          >
            👋 Onboarding
          </button>
          <button
            onClick={() => handleTabChange('swipe')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold font-['Space_Grotesk'] whitespace-nowrap transition-all ${
              activeTab === 'swipe'
                ? 'bg-[oklch(0.28_0.02_250)] text-white shadow'
                : 'text-[oklch(0.75_0.02_250)] hover:text-white hover:bg-[oklch(0.22_0.02_250)]'
            }`}
          >
            🔥 Swipe
          </button>
          <button
            onClick={() => handleTabChange('leaderboard')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold font-['Space_Grotesk'] whitespace-nowrap transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-[oklch(0.28_0.02_250)] text-white shadow'
                : 'text-[oklch(0.75_0.02_250)] hover:text-white hover:bg-[oklch(0.22_0.02_250)]'
            }`}
          >
            📊 Leaderboard
          </button>
          <button
            onClick={() => setShowHelpTooltip(true)}
            className={`flex h-10 min-w-[44px] items-center justify-center rounded-full px-3 text-sm font-semibold font-['Space_Grotesk'] whitespace-nowrap transition-all ${
              showHelpTooltip
                ? 'bg-[oklch(0.28_0.02_250)] text-white shadow'
                : 'bg-[oklch(0.22_0.02_250)]/50 text-[oklch(0.75_0.02_250)] hover:text-white hover:bg-[oklch(0.22_0.02_250)]'
            }`}
            aria-label="Help"
            title="Help"
          >
            ?
          </button>
        </nav>

        <div className={`absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-[oklch(0.28_0.02_250)] bg-[oklch(0.18_0.03_250)] p-3 shadow-xl sm:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <button
            onClick={() => {
              handleTabChange('onboarding');
              setIsMobileMenuOpen(false);
            }}
            className="w-full rounded-lg px-4 py-3 text-left text-sm font-semibold font-['Space_Grotesk'] text-[oklch(0.95_0.02_250)] transition-colors hover:bg-[oklch(0.22_0.02_250)]"
          >
            👋 Onboarding
          </button>
          <button
            onClick={() => {
              handleTabChange('swipe');
              setIsMobileMenuOpen(false);
            }}
            className="mt-2 w-full rounded-lg px-4 py-3 text-left text-sm font-semibold font-['Space_Grotesk'] text-[oklch(0.95_0.02_250)] transition-colors hover:bg-[oklch(0.22_0.02_250)]"
          >
            🔥 Swipe
          </button>
          <button
            onClick={() => {
              handleTabChange('leaderboard');
              setIsMobileMenuOpen(false);
            }}
            className="mt-2 w-full rounded-lg px-4 py-3 text-left text-sm font-semibold font-['Space_Grotesk'] text-[oklch(0.95_0.02_250)] transition-colors hover:bg-[oklch(0.22_0.02_250)]"
          >
            📊 Leaderboard
          </button>
          <button
            onClick={() => {
              setShowHelpTooltip(true);
              setIsMobileMenuOpen(false);
            }}
            className="mt-2 w-full rounded-lg px-4 py-3 text-left text-sm font-semibold font-['Space_Grotesk'] text-[oklch(0.75_0.02_250)] transition-colors hover:bg-[oklch(0.22_0.02_250)]"
          >
            ? Help
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 flex flex-col">
        <div className="sticky top-[122px] z-40">
          <NewsTicker />
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 flex-1">
          {activeTab === 'onboarding' && <OnboardingDemo onComplete={handleOnboardingComplete} />}
          {activeTab === 'swipe' && (
            <div className="flex-1 flex flex-col justify-center py-2">
              <SwipeCardDemo />
            </div>
          )}
          {activeTab === 'leaderboard' && <LeaderboardDemo />}
        </div>
      </main>

      {showHelpTooltip && (
        <div onClick={() => setShowHelpTooltip(false)} className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-dialog-title"
            aria-describedby="help-dialog-description"
            className="w-full max-w-2xl rounded-[28px] border border-[oklch(0.28_0.02_250)] bg-[oklch(0.15_0.04_250)] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] text-[oklch(0.95_0.02_250)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.26em] text-[oklch(0.75_0.02_250)] font-semibold">Help</p>
                <h2 id="help-dialog-title" className="mt-2 text-3xl font-bold font-['Space_Grotesk']">Need a quick tour?</h2>
              </div>
              <button
                ref={helpCloseButtonRef}
                onClick={() => setShowHelpTooltip(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[oklch(0.28_0.02_250)] bg-[oklch(0.18_0.03_250)] text-[oklch(0.95_0.02_250)] transition-colors hover:bg-[oklch(0.22_0.02_250)]"
                aria-label="Close help panel"
              >
                ✕
              </button>
            </div>
            <div id="help-dialog-description" className="mt-6 space-y-5 text-sm leading-7 text-[oklch(0.80_0.02_250)]">
              <p>The help panel stays on top of the app and keeps the current page visible underneath.</p>
              <ul className="space-y-3">
                <li className="rounded-2xl bg-[oklch(0.18_0.03_250)] p-4">
                  <strong className="font-semibold">Onboarding</strong>: Finish the guided setup to get your daily swipe flow started.
                </li>
                <li className="rounded-2xl bg-[oklch(0.18_0.03_250)] p-4">
                  <strong className="font-semibold">Swipe</strong>: Swipe left for no like, right for like, or press skip to pass.
                </li>
                <li className="rounded-2xl bg-[oklch(0.18_0.03_250)] p-4">
                  <strong className="font-semibold">Leaderboard</strong>: See how today’s leaders compare across the world.
                </li>
              </ul>
              <p className="text-xs uppercase tracking-[0.24em] text-[oklch(0.72_0.15_65)]">Tap the close button or click outside to dismiss.</p>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Disclaimer Footer */}
      <footer className="py-4 px-6 border-t border-[oklch(0.28_0.02_250)] bg-[oklch(0.13_0.04_250)] text-center">
        <p className="text-xs text-[oklch(0.75_0.02_250)] opacity-60 max-w-2xl mx-auto font-['Inter'] leading-relaxed">
          Entertainment product. Reflects activity of app users only — not a scientific or representative poll.
        </p>
      </footer>
    </div>
  );
}

export default App;
