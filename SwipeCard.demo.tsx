import { useState } from 'react';
import SwipeCard from './SwipeCard';
import type { CardData } from './SwipeCard.types';
import { availableCountries } from './rate-my-president-demo/src/countries';

export function SwipeCardDemo() {
  const [voteHistory, setVoteHistory] = useState<string[]>([]);

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
      yesterdayVote: 'approve',
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
      yesterdayVote: 'disapprove',
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
    const countries = [
      { code: 'US', name: 'United States', flag: '🇺🇸', leaders: ['Donald Trump'] },
      { code: 'DE', name: 'Germany', flag: '🇩🇪', leaders: ['Olaf Scholz'] },
      { code: 'JP', name: 'Japan', flag: '🇯🇵', leaders: ['Fumio Kishida'] },
      { code: 'BR', name: 'Brazil', flag: '🇧🇷', leaders: ['Luiz Inácio Lula da Silva'] },
      { code: 'ZA', name: 'South Africa', flag: '🇿🇦', leaders: ['Cyril Ramaphosa'] },
    ];

    const eligibleCountries = countries.filter((country) => !excludedCodes.includes(country.code));
    const randomCountry = eligibleCountries.length > 0
      ? eligibleCountries[Math.floor(Math.random() * eligibleCountries.length)]
      : countries[Math.floor(Math.random() * countries.length)];
    const leader = randomCountry.leaders[0];
    const seed = leader
      .split(' ')
      .map((n) => n[0])
      .join('');

    const colors = ['2f4f4f', '4682b4', '8b0000', '556b2f', '4b0082'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    return {
      id,
      type: Math.random() > 0.5 ? 'home' : 'global',
      countryCode: randomCountry.code,
      countryName: randomCountry.name,
      countryFlag: randomCountry.flag,
      leaderName: leader,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=${randomColor}`,
      approvalPercent: Math.floor(Math.random() * 100),
      trend: (['up', 'down', 'neutral'][Math.floor(Math.random() * 3)] as any),
      headlines: [
        {
          title: `${leader} addresses delegation at summit`,
          source: 'Reuters',
          date: 'Jul 6, 2026',
          url: 'https://reuters.com',
        },
      ],
      yesterdayVote: (['approve', 'disapprove', 'skip'][Math.floor(Math.random() * 3)] as any),
    };
  };

  const handleVote = (action: string | null) => {
    const voteStr = action || 'skip';
    setVoteHistory((prev) => [...prev, voteStr]);
    console.log('Vote recorded:', voteStr);

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
                  vote === 'approve' 
                    ? 'text-[oklch(0.62_0.18_142)]' 
                    : vote === 'disapprove' 
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
