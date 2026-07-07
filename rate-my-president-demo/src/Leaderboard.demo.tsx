import { useState, useEffect } from 'react';
import Leaderboard from './Leaderboard';
import type { LeaderboardEntry } from './Leaderboard.types';

export function LeaderboardDemo() {
  const [selectedWindow, setSelectedWindow] = useState<'day' | 'week' | 'all'>('day');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  // Mock data for demonstration
  const mockDataByWindow = {
    day: [
      { id: '1', rank: 1, name: 'Keir Starmer', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 68, trend: 'up' as const, voteCount: 12450 },
      { id: '2', rank: 2, name: 'Emmanuel Macron', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 64, trend: 'up' as const, voteCount: 11230 },
      { id: '3', rank: 3, name: 'Ursula von der Leyen', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 58, trend: 'down' as const, voteCount: 9870 },
      { id: '4', rank: 4, name: 'Joe Biden', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 54, trend: 'up' as const, voteCount: 14200 },
      { id: '5', rank: 5, name: 'Donald Trump', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 48, trend: 'down' as const, voteCount: 13100 },
      { id: '6', rank: 6, name: 'Justin Trudeau', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 42, trend: 'down' as const, voteCount: 8960 },
      { id: '7', rank: 7, name: 'Narendra Modi', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 71, trend: 'up' as const, voteCount: 16540 },
      { id: '8', rank: 8, name: 'Xi Jinping', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 62, trend: 'up' as const, voteCount: 10230 },
    ],
    week: [
      { id: '1', rank: 1, name: 'Narendra Modi', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 72, trend: 'up' as const, voteCount: 85600 },
      { id: '2', rank: 2, name: 'Keir Starmer', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 66, trend: 'down' as const, voteCount: 78900 },
      { id: '3', rank: 3, name: 'Emmanuel Macron', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 61, trend: 'up' as const, voteCount: 72100 },
      { id: '4', rank: 4, name: 'Xi Jinping', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 59, trend: 'down' as const, voteCount: 68500 },
      { id: '5', rank: 5, name: 'Joe Biden', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 52, trend: 'up' as const, voteCount: 81200 },
      { id: '6', rank: 6, name: 'Ursula von der Leyen', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 55, trend: 'up' as const, voteCount: 64300 },
      { id: '7', rank: 7, name: 'Donald Trump', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 46, trend: 'down' as const, voteCount: 79100 },
      { id: '8', rank: 8, name: 'Justin Trudeau', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 39, trend: 'down' as const, voteCount: 56200 },
    ],
    all: [
      { id: '1', rank: 1, name: 'Narendra Modi', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 68, trend: 'up' as const, voteCount: 342100 },
      { id: '2', rank: 2, name: 'Emmanuel Macron', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 62, trend: 'up' as const, voteCount: 298700 },
      { id: '3', rank: 3, name: 'Keir Starmer', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 60, trend: 'down' as const, voteCount: 285400 },
      { id: '4', rank: 4, name: 'Xi Jinping', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 58, trend: 'up' as const, voteCount: 267800 },
      { id: '5', rank: 5, name: 'Joe Biden', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 51, trend: 'down' as const, voteCount: 312600 },
      { id: '6', rank: 6, name: 'Ursula von der Leyen', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 53, trend: 'up' as const, voteCount: 241200 },
      { id: '7', rank: 7, name: 'Donald Trump', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 44, trend: 'down' as const, voteCount: 298400 },
      { id: '8', rank: 8, name: 'Justin Trudeau', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 38, trend: 'down' as const, voteCount: 189600 },
    ],
  };

  // Simulate data loading on window change
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      setEntries(mockDataByWindow[selectedWindow]);
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [selectedWindow]);

  const handleWindowChange = (window: 'day' | 'week' | 'all') => {
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
      <div className="max-w-4xl mx-auto">
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
