import { useState, useEffect } from 'react';
import Leaderboard from './Leaderboard';
import { leaderboardMockDataByWindow, type LeaderboardWindow } from './mockData';

export function LeaderboardDemo() {
  const [selectedWindow, setSelectedWindow] = useState<LeaderboardWindow>('day');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState(leaderboardMockDataByWindow.day);

  // Simulate data loading on window change
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      setEntries(leaderboardMockDataByWindow[selectedWindow]);
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [selectedWindow]);

  const handleWindowChange = (window: LeaderboardWindow) => {
    setSelectedWindow(window);
  };

  const handleLeaderClick = (leaderId: string) => {
    const leader = entries.find((e) => e.id === leaderId);
    console.log('Clicked leader:', leader?.name);
  };

  const getLastUpdatedTime = () => {
    const minutes = Math.floor(Math.random() * 5) + 1;
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-[oklch(0.15_0.04_250)]">
      <div className="w-full">
        {/* Header */}
        <div className="p-6 border-b border-[oklch(0.28_0.02_250)]">
          <h1 className="text-3xl font-bold font-['Space_Grotesk'] text-[oklch(0.95_0.02_250)] mb-2">
            Global Rankings
          </h1>
          <p className="text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">
            See how your vote impacts the worldwide consensus.
          </p>
        </div>

        {/* Leaderboard */}
        <Leaderboard
          entries={entries}
          isLoading={isLoading}
          error={error}
          selectedWindow={selectedWindow}
          onWindowChange={handleWindowChange}
          onLeaderClick={handleLeaderClick}
          lastUpdated={!isLoading && entries.length > 0 ? getLastUpdatedTime() : undefined}
        />

        {/* Controls & Info */}
        <div className="p-6 border-t border-[oklch(0.28_0.02_250)]">
          <div className="space-y-4">
            <div>
              <h3 className="font-['Space_Grotesk'] font-600 text-[oklch(0.95_0.02_250)] mb-2">
                Demo Controls
              </h3>
              <button
                onClick={() => setError('Unable to load rankings. Try refreshing.')}
                className="mr-2 px-3 py-2 bg-[oklch(0.55_0.20_25)] text-white rounded text-sm font-['Space_Grotesk'] font-600 hover:opacity-90 transition-opacity"
              >
                Trigger Error
              </button>
              <button
                onClick={() => setError(null)}
                className="px-3 py-2 bg-[oklch(0.62_0.18_142)] text-white rounded text-sm font-['Space_Grotesk'] font-600 hover:opacity-90 transition-opacity"
              >
                Clear Error
              </button>
            </div>

            <div>
              <p className="text-xs text-[oklch(0.75_0.02_250)] font-['Inter']">
                <strong>Interactive features:</strong>
              </p>
              <ul className="text-xs text-[oklch(0.75_0.02_250)] font-['Inter'] list-disc list-inside mt-2 space-y-1">
                <li>Click column headers (Rank, Approval, Votes) to sort ascending/descending</li>
                <li>Switch between Today, This Week, and All-Time tabs</li>
                <li>Hover over a leader row to see the highlight effect</li>
                <li>Click a leader name to log their ID to the console</li>
                <li>Approval % color changes: green (≥50%), red (&lt;50%)</li>
              </ul>
            </div>

            <div>
              <p className="text-xs text-[oklch(0.75_0.02_250)] font-['Inter']">
                <strong>Responsive design:</strong> Try resizing your browser to see columns hide on smaller screens (Trend on mobile, Votes on tablet)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeaderboardDemo;
