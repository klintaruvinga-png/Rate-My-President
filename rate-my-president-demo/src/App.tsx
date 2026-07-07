import { useState } from 'react';
import './App.css';
import OnboardingDemo from './Onboarding.demo';
import SwipeCardDemo from './SwipeCard.demo';
import LeaderboardDemo from './Leaderboard.demo';
import headerImage from '../../assets/Obama Header No BG.png';
import AnimatedGlobe from './AnimatedGlobe';
import { getHasCompletedOnboarding, setHasCompletedOnboarding } from './onboardingStorage';

function App() {
  const [activeTab, setActiveTab] = useState<'swipe' | 'onboarding' | 'leaderboard'>(() => {
    if (typeof window === 'undefined') {
      return 'onboarding';
    }

    return getHasCompletedOnboarding() ? 'swipe' : 'onboarding';
  });
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    setActiveTab('swipe');
  };

  const handleTabChange = (tab: 'swipe' | 'onboarding' | 'leaderboard') => {
    setActiveTab(tab);
  };

  return (
    <div className="bg-[oklch(0.15_0.04_250)] min-h-screen text-[oklch(0.95_0.02_250)] flex flex-col">
      {/* Premium Navigation Header */}
      <header className="border-b border-[oklch(0.28_0.02_250)] bg-[oklch(0.18_0.03_250)] px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <img src={headerImage} alt="Rate My President mascot" className="h-[90px] w-[90px] rounded-2xl bg-white/10 p-2 shadow-sm" />
          <div>
            <h1 className="text-xl font-bold font-['Space_Grotesk'] tracking-tight">Rate My President</h1>
            <span className="text-xs text-[oklch(0.72_0.15_65)] font-semibold uppercase tracking-widest font-['Space_Grotesk']">Playground</span>
          </div>
        </div>
        {/* video moved to main content */}
        <nav className="flex gap-2 flex-nowrap items-center overflow-x-auto pr-8">
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
          <div className="relative">
            <button
              onClick={() => setShowHelpTooltip((value) => !value)}
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

              {showHelpTooltip && (
              <div
                role="tooltip"
                className="absolute right-4 top-full z-[60] mt-2 w-72 rounded-2xl border border-[oklch(0.28_0.02_250)] bg-[oklch(0.20_0.02_250)] p-4 text-sm text-[oklch(0.75_0.02_250)] shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-bold text-white">Swipe controls</h2>
                  <button
                    onClick={() => setShowHelpTooltip(false)}
                    className="text-xs opacity-70 transition-opacity hover:opacity-100"
                    aria-label="Close help"
                  >
                    Close
                  </button>
                </div>
                <ul className="mt-3 space-y-1 text-xs opacity-90">
                  <li>• Swipe left/right to vote</li>
                  <li>• Swipe up to skip</li>
                  <li>• Keyboard: D/Right = approve</li>
                  <li>• Keyboard: A/Left = disapprove</li>
                  <li>• Keyboard: S/Up = skip</li>
                </ul>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="mt-3 flex-1">
        <AnimatedGlobe />
        {activeTab === 'onboarding' && <OnboardingDemo onComplete={handleOnboardingComplete} />}
        {activeTab === 'swipe' && <SwipeCardDemo />}
        {activeTab === 'leaderboard' && <LeaderboardDemo />}
      </main>

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
