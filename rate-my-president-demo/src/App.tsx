import { useState } from 'react';
import './App.css';
import OnboardingDemo from './Onboarding.demo';
import SwipeCardDemo from './SwipeCard.demo';
import LeaderboardDemo from './Leaderboard.demo';

function App() {
  const [activeTab, setActiveTab] = useState<'swipe' | 'onboarding' | 'leaderboard'>('swipe');

  return (
    <div className="bg-[oklch(0.15_0.04_250)] min-h-screen text-[oklch(0.95_0.02_250)] flex flex-col">
      {/* Premium Navigation Header */}
      <header className="border-b border-[oklch(0.28_0.02_250)] bg-[oklch(0.18_0.03_250)] px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏛️</span>
          <div>
            <h1 className="text-xl font-bold font-['Space_Grotesk'] tracking-tight">Rate My President</h1>
            <span className="text-xs text-[oklch(0.72_0.15_65)] font-semibold uppercase tracking-widest font-['Space_Grotesk']">Playground</span>
          </div>
        </div>
        
        <nav className="flex gap-2">
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold font-['Space_Grotesk'] transition-all ${
              activeTab === 'onboarding'
                ? 'bg-[oklch(0.28_0.02_250)] text-white shadow'
                : 'text-[oklch(0.75_0.02_250)] hover:text-white hover:bg-[oklch(0.22_0.02_250)]'
            }`}
          >
            👋 Onboarding
          </button>
          <button
            onClick={() => setActiveTab('swipe')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold font-['Space_Grotesk'] transition-all ${
              activeTab === 'swipe'
                ? 'bg-[oklch(0.28_0.02_250)] text-white shadow'
                : 'text-[oklch(0.75_0.02_250)] hover:text-white hover:bg-[oklch(0.22_0.02_250)]'
            }`}
          >
            🔥 Swipe Stack
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold font-['Space_Grotesk'] transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-[oklch(0.28_0.02_250)] text-white shadow'
                : 'text-[oklch(0.75_0.02_250)] hover:text-white hover:bg-[oklch(0.22_0.02_250)]'
            }`}
          >
            📊 Leaderboard
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'onboarding' && <OnboardingDemo />}
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
