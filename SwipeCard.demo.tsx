import { useState } from 'react';
import SwipeCard from './SwipeCard';
import type { CardData, VoteAction } from './SwipeCard.types';
import { availableCountries } from './rate-my-president-demo/src/countries';

export function SwipeCardDemo() {
  const [voteHistory, setVoteHistory] = useState<VoteAction[]>([]);

  // Initial mock cards list
  const initialCards: CardData[] = [
    {
      id: 'uk-2026-07-06',
      type: 'home',
      countryCode: 'GB',
      countryName: 'United Kingdom',
      countryFlag: '🇬🇧',
      leaderName: 'Keir Starmer',
      avatarUrl: availableCountries.find(c => c.code === 'GB')?.avatarUrl ?? 'https://api.dicebear.com/7.x/initials/svg?seed=KS&backgroundColor=2f4f4f',
      headerImageUrl: availableCountries.find(c => c.code === 'GB')?.avatarUrl ?? 'https://api.dicebear.com/7.x/initials/svg?seed=KS&backgroundColor=2f4f4f',
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
      yesterdayVote: 'like',
    },
    {
      id: 'fr-2026-07-06',
      type: 'global',
      countryCode: 'FR',
      countryName: 'France',
      countryFlag: '🇫🇷',
      leaderName: 'Emmanuel Macron',
      avatarUrl: availableCountries.find(c => c.code === 'FR')?.avatarUrl ?? 'https://api.dicebear.com/7.x/initials/svg?seed=EM&backgroundColor=4682b4',
      headerImageUrl: availableCountries.find(c => c.code === 'FR')?.avatarUrl ?? 'https://api.dicebear.com/7.x/initials/svg?seed=EM&backgroundColor=4682b4',
      approvalPercent: 32,
      trend: 'neutral',
      headlines: [
        {
          title: 'Macron calls for regional cooperation in summit',
          source: 'Le Monde',
          date: 'Jul 5, 2026',
          url: 'https://lemonde.fr',
        },
      ],
      yesterdayVote: 'nolike',
    },
    {
      id: 'in-2026-07-06',
      type: 'global',
      countryCode: 'IN',
      countryName: 'India',
      countryFlag: '🇮🇳',
      leaderName: 'Narendra Modi',
      avatarUrl: availableCountries.find(c => c.code === 'IN')?.avatarUrl ?? 'https://api.dicebear.com/7.x/initials/svg?seed=NM&backgroundColor=8b0000',
      headerImageUrl: availableCountries.find(c => c.code === 'IN')?.avatarUrl ?? 'https://api.dicebear.com/7.x/initials/svg?seed=NM&backgroundColor=8b0000',
      approvalPercent: 68,
      trend: 'up',
      headlines: [
        {
          title: 'Economic expansion leads key sector growth',
          source: 'Times of India',
          date: 'Jul 6, 2026',
          url: 'https://timesofindia.indiatimes.com',
        },
      ],
      yesterdayVote: 'skip',
    },
  ];

  const [cardsQueue, setCardsQueue] = useState<CardData[]>(initialCards);

  const generateRandomCard = (id: string, excludedCodes: string[] = []): CardData => {
    const pool = availableCountries.filter((c) => !excludedCodes.includes(c.code));
    const country = pool.length > 0
      ? pool[Math.floor(Math.random() * pool.length)]
      : availableCountries[Math.floor(Math.random() * availableCountries.length)];

    const makeAvatarUrl = (seed: string, color: string) =>
      `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=${color}`;

    const avatarUrl = country.avatarUrl ?? makeAvatarUrl(
      country.avatarSeed ?? country.code,
      country.avatarColor ?? '2f4f4f'
    );

    return {
      id,
      type: Math.random() > 0.5 ? 'home' : 'global',
      countryCode: country.code,
      countryName: country.name,
      countryFlag: country.flag,
      leaderName: country.leader ?? country.name,
      avatarUrl: avatarUrl,
      headerImageUrl: avatarUrl,
      approvalPercent: Math.floor(Math.random() * 100),
      trend: (['up', 'down', 'neutral'][Math.floor(Math.random() * 3)] as any),
      headlines: [
        {
          title: `${country.leader ?? country.name} addresses delegation at summit`,
          source: 'Reuters',
          date: 'Jul 6, 2026',
          url: 'https://reuters.com',
        },
      ],
      yesterdayVote: (['like', 'nolike', 'skip'][Math.floor(Math.random() * 3)] as any),
    };
  };

  const handleVote = (action: VoteAction) => {
    const voteAction = action ?? 'skip';
    setVoteHistory((prev) => [...prev, voteAction]);
    console.log('Vote recorded:', voteAction);

    // After 2.5 seconds (allowing results to show for a brief moment), advance queue
    setTimeout(() => {
      setCardsQueue((prev) => {
        const nextQueue = prev.slice(1);
        // Ensure there are always at least 3 cards in the queue to maintain stack visuals
        while (nextQueue.length < 3) {
          const existingCodes = nextQueue.map((card) => card.countryCode);
          nextQueue.push(generateRandomCard(`card-${Date.now()}`, existingCodes));
        }
        return nextQueue;
      });
    }, 2500);
  };

  // Top card and next card in stack
  const currentCard = cardsQueue[0];
  const nextCard = cardsQueue[1];

  if (!currentCard) {
    return (
      <div className="bg-[oklch(0.15_0.04_250)] min-h-screen flex items-center justify-center">
        <p className="text-white opacity-60">Loading stack...</p>
      </div>
    );
  }

  return (
    <div className="bg-[oklch(0.15_0.04_250)] h-full flex flex-col items-center justify-center">
      <SwipeCard
        card={currentCard}
        nextCard={nextCard}
        onVote={handleVote}
        showMicroHistory={true}
      />

      {/* Debug info */}
      <div className="fixed bottom-4 left-4 bg-[oklch(0.20_0.02_250)] p-4 rounded-lg text-[oklch(0.75_0.02_250)] text-sm max-w-xs border border-[oklch(0.28_0.02_250)] shadow-xl z-50">
        <h3 className="font-bold mb-2 text-white">Vote History:</h3>
        {voteHistory.length === 0 ? (
          <p className="opacity-60">No votes yet. Try swiping!</p>
        ) : (
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {voteHistory.map((vote, idx) => (
              <div key={idx} className="flex justify-between gap-4 border-b border-[oklch(0.28_0.02_250)] pb-1">
                <span>Leader {idx + 1}:</span>
                <span className={`font-semibold ${
                  vote === 'like' 
                    ? 'text-[oklch(0.62_0.18_142)]' 
                    : vote === 'nolike' 
                      ? 'text-[oklch(0.55_0.20_25)]' 
                      : 'text-[oklch(0.72_0.15_65)]'
                }`}>
                  {vote.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="fixed top-4 right-4 bg-[oklch(0.20_0.02_250)] p-4 rounded-lg text-[oklch(0.75_0.02_250)] text-sm max-w-xs border border-[oklch(0.28_0.02_250)] shadow-xl z-50">
        <h3 className="font-bold mb-2 text-white">Controls:</h3>
        <ul className="space-y-1 opacity-80 text-xs">
          <li>• Swipe left/right (pointer gestures)</li>
          <li>• Swipe up to Skip</li>
          <li>• Keyboard: D/Right = Like</li>
          <li>• Keyboard: A/Left = No Like</li>
          <li>• Keyboard: S/Up = Skip</li>
          <li>• Mobile: Haptic feedback on vote</li>
        </ul>
      </div>
    </div>
  );
}

export default SwipeCardDemo;
