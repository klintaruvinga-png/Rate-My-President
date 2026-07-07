import React, { useState } from 'react';
import SwipeCard, { SwipeCardProps } from './SwipeCard';

export function SwipeCardDemo() {
  const [voteHistory, setVoteHistory] = useState<string[]>([]);

  // Example card data
  const exampleCard: Parameters<typeof SwipeCard>[0]['card'] = {
    id: 'uk-2026-07-06',
    type: 'home',
    countryCode: 'GB',
    countryName: 'United Kingdom',
    countryFlag: '🇬🇧',
    leaderName: 'Keir Starmer',
    avatarUrl: 'https://via.placeholder.com/120x120?text=KS',
    approvalPercent: 47,
    trend: 'down',
    headlines: [
      {
        title: 'Prime Minister announces new policy initiative',
        source: 'BBC News',
        date: 'Jul 5, 2026',
        url: 'https://bbc.com',
      },
      {
        title: 'Government approval rating declines amid economic concerns',
        source: 'The Guardian',
        date: 'Jul 4, 2026',
        url: 'https://theguardian.com',
      },
    ],
    yesterdayVote: 'approve',
  };

  const [currentCard, setCurrentCard] = useState(exampleCard);

  const handleVote = (action: string) => {
    setVoteHistory((prev) => [...prev, action || 'null']);
    console.log('Vote recorded:', action);

    // Simulate loading next card after a delay
    setTimeout(() => {
      const actions = ['approve', 'disapprove', 'skip'];
      const nextAction = actions[Math.floor(Math.random() * actions.length)];
      setCurrentCard((prev) => ({
        ...prev,
        id: `card-${Date.now()}`,
        type: prev.type === 'home' ? 'global' : 'home',
        leaderName: ['Emmanuel Macron', 'Narendra Modi', 'Javier Milei', 'Fumio Kishida'][
          Math.floor(Math.random() * 4)
        ],
        approvalPercent: Math.floor(Math.random() * 100),
        trend: ['up', 'down', 'neutral'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'neutral',
        yesterdayVote:
          ['approve', 'disapprove', 'skip'][Math.floor(Math.random() * 3)] as
            | 'approve'
            | 'disapprove'
            | 'skip',
      }));
    }, 1500);
  };

  return (
    <div className="bg-[oklch(0.15_0.04_250)] min-h-screen">
      <SwipeCard card={currentCard} onVote={handleVote} showMicroHistory={true} />

      {/* Debug info */}
      <div className="fixed bottom-4 left-4 bg-[oklch(0.20_0.02_250)] p-4 rounded-lg text-[oklch(0.75_0.02_250)] text-sm max-w-xs">
        <h3 className="font-bold mb-2">Vote History:</h3>
        {voteHistory.length === 0 ? (
          <p className="opacity-60">No votes yet. Try swiping!</p>
        ) : (
          <div className="space-y-1">
            {voteHistory.map((vote, idx) => (
              <div key={idx}>
                {idx + 1}. {vote || 'skipped'}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="fixed top-4 right-4 bg-[oklch(0.20_0.02_250)] p-4 rounded-lg text-[oklch(0.75_0.02_250)] text-sm max-w-xs">
        <h3 className="font-bold mb-2">Controls:</h3>
        <ul className="space-y-1 opacity-80 text-xs">
          <li>• Swipe left/right or use buttons</li>
          <li>• Keyboard: D/Right = Approve</li>
          <li>• Keyboard: A/Left = Disapprove</li>
          <li>• Keyboard: S/Up = Skip</li>
          <li>• Mobile: Haptic feedback on vote</li>
        </ul>
      </div>
    </div>
  );
}

export default SwipeCardDemo;
