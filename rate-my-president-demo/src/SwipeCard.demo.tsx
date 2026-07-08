import { useState } from 'react';
import SwipeCard from './SwipeCard';
import type { CardData, VoteAction } from './SwipeCard.types';
import { getUserCountry } from './onboardingStorage';
import { availableCountries } from './countries';

// ── helpers ───────────────────────────────────────────────────────────────────

const makeAvatarUrl = (seed: string, color: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=${color}`;

const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const today = new Date().toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function buildHomeCard(countryCode: string): CardData | null {
  const country = availableCountries.find((c) => c.code === countryCode);
  if (!country) return null;
  return {
    id: `home-${country.code}-${Date.now()}`,
    type: 'home',
    countryCode: country.code,
    countryName: country.name,
    countryFlag: country.flag,
    leaderName: country.leader ?? country.name,
    avatarUrl: makeAvatarUrl(country.avatarSeed ?? country.code, country.avatarColor ?? '2f4f4f'),
    approvalPercent: Math.floor(Math.random() * 100),
    trend: randomItem(['up', 'down', 'neutral'] as const),
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
}

function buildGlobalCard(id: string, excludeCode?: string): CardData {
  const pool = availableCountries.filter((c) => c.code !== excludeCode);
  const country = randomItem(pool);
  return {
    id,
    type: 'global',
    countryCode: country.code,
    countryName: country.name,
    countryFlag: country.flag,
    leaderName: country.leader ?? country.name,
    avatarUrl: makeAvatarUrl(country.avatarSeed ?? country.code, country.avatarColor ?? '2f4f4f'),
    approvalPercent: Math.floor(Math.random() * 100),
    trend: randomItem(['up', 'down', 'neutral'] as const),
    headlines: [
      {
        title: `${country.leader ?? country.name} speaks at international summit`,
        source: 'Reuters',
        date: today,
        url: 'https://reuters.com',
      },
    ],
    yesterdayVote: undefined,
  };
}

function buildInitialQueue(homeCode: string | null): CardData[] {
  const queue: CardData[] = [];

  if (homeCode) {
    const homeCard = buildHomeCard(homeCode);
    if (homeCard) queue.push(homeCard);
  }

  // Fill to at least 3 cards with global picks
  while (queue.length < 3) {
    queue.push(
      buildGlobalCard(`global-${Date.now()}-${queue.length}`, homeCode ?? undefined)
    );
  }

  return queue;
}

// ── component ─────────────────────────────────────────────────────────────────

export function SwipeCardDemo() {
  const savedCountryCode = getUserCountry();
  const [voteHistory, setVoteHistory] = useState<VoteAction[]>([]);
  const [cardsQueue, setCardsQueue] = useState<CardData[]>(() =>
    buildInitialQueue(savedCountryCode)
  );

  const handleVote = (action: VoteAction) => {
    const voteAction = action ?? 'skip';
    setVoteHistory((prev) => [...prev, voteAction]);
    console.log('Vote recorded:', voteAction);

    setTimeout(() => {
      setCardsQueue((prev) => {
        const nextQueue = prev.slice(1);
        while (nextQueue.length < 3) {
          nextQueue.push(
            buildGlobalCard(
              `global-${Date.now()}-${nextQueue.length}`,
              savedCountryCode ?? undefined
            )
          );
        }
        return nextQueue;
      });
    }, 2500);
  };

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
    <div className="bg-[oklch(0.15_0.04_250)] min-h-screen">
      <SwipeCard
        card={currentCard}
        nextCard={nextCard}
        onVote={handleVote}
        showMicroHistory={true}
      />

      {/* Vote History — top-right on desktop only */}
      <div className="hidden lg:block fixed top-80 right-4 bg-[oklch(0.20_0.02_250)] p-4 rounded-lg text-[oklch(0.75_0.02_250)] text-sm max-w-xs border border-[oklch(0.28_0.02_250)] shadow-xl z-40">
        <h3 className="font-bold mb-2 text-white">Vote History:</h3>
        {voteHistory.length === 0 ? (
          <p className="opacity-60 text-xs">No votes yet. Try swiping!</p>
        ) : (
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {voteHistory.map((vote, idx) => {
              const voteLabel = vote === 'approve'
                ? 'APPROVE'
                : vote === 'disapprove'
                  ? 'OPPOSE'
                  : 'SKIP';
              const voteColor = vote === 'approve'
                ? 'text-[oklch(0.62_0.18_142)]'
                : vote === 'disapprove'
                  ? 'text-[oklch(0.55_0.20_25)]'
                  : 'text-[oklch(0.72_0.15_65)]';

              return (
                <div
                  key={idx}
                  className="flex justify-between gap-4 border-b border-[oklch(0.28_0.02_250)] pb-1 text-xs"
                >
                  <span>Leader {idx + 1}:</span>
                  <span className={`font-semibold ${voteColor}`}>
                    {voteLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SwipeCardDemo;
