import { useState } from 'react';
import SwipeCard from './SwipeCard';
import type { CardData, VoteAction } from './SwipeCard.types';
import { getUserCountry } from './onboardingStorage';
import { availableCountries } from './countries';
import { getNextDailyResetTimestamp } from '@root/swipeLockStorage';

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
  const avatarUrl = country.avatarUrl ?? makeAvatarUrl(country.avatarSeed ?? country.code, country.avatarColor ?? '2f4f4f');
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

function buildGlobalCard(id: string, excludeCode?: string, existingCodes: string[] = []): CardData {
  const excludedCodes = [excludeCode, ...existingCodes].filter((code): code is string => Boolean(code));
  let pool = availableCountries.filter((c) => !excludedCodes.includes(c.code));

  if (pool.length === 0) {
    pool = availableCountries.filter((c) => !existingCodes.includes(c.code));
  }

  if (pool.length === 0) {
    pool = availableCountries;
  }

  const country = randomItem(pool);
  const avatarUrl = country.avatarUrl ?? makeAvatarUrl(country.avatarSeed ?? country.code, country.avatarColor ?? '2f4f4f');
  return {
    id: `${id}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'global',
    countryCode: country.code,
    countryName: country.name,
    countryFlag: country.flag,
    leaderName: country.leader ?? country.name,
    avatarUrl: avatarUrl,
    headerImageUrl: avatarUrl,
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

function buildInitialQueue(homeCode: string | null, dailyLimit: number): CardData[] {
  const queue: CardData[] = [];

  if (homeCode) {
    const homeCard = buildHomeCard(homeCode);
    if (homeCard) queue.push(homeCard);
  }

  // Add global cards up to the daily limit
  const globalCardsNeeded = dailyLimit - queue.length;
  for (let i = 0; i < globalCardsNeeded; i++) {
    queue.push(
      buildGlobalCard(
        `global-${Date.now()}-${queue.length}`,
        homeCode ?? undefined,
        queue.map((card) => card.countryCode)
      )
    );
  }

  return queue;
}

// ── component ─────────────────────────────────────────────────────────────────

export function SwipeCardDemo({
  onNavigateToLeaderboard,
  onSwipe,
}: {
  onNavigateToLeaderboard?: () => void;
  onSwipe?: (action: VoteAction, cardId: string, cardType: 'home' | 'global') => void;
} = {}) {
  const savedCountryCode = getUserCountry();
  const hasHomeCountry = savedCountryCode !== null;
  const dailyLimit = hasHomeCountry ? 2 : 1;
  const [voteHistory, setVoteHistory] = useState<VoteAction[]>([]);
  const [swipeCount, setSwipeCount] = useState(0);
  const [cardsQueue, setCardsQueue] = useState<CardData[]>(() => {
    return buildInitialQueue(savedCountryCode, dailyLimit);
  });
  const [isLimitReached, setIsLimitReached] = useState(false);

  const handleVote = (action: VoteAction): boolean => {
    const voteAction = action ?? 'skip';

    // In production, this would call the server API and derive allowed/count from the response
    // For demo: simulate server behavior by tracking count locally
    const newCount = swipeCount + 1;
    const allowed = swipeCount < dailyLimit;

    if (allowed) {
      setVoteHistory((prev) => [...prev, voteAction]);
      setSwipeCount(newCount);
      console.log('Vote recorded:', voteAction);

      // Persist to backend (best-effort; server enforces daily limit)
      if (onSwipe && currentCard) {
        onSwipe(voteAction, currentCard.id, currentCard.type);
      }

      setTimeout(() => {
        setCardsQueue((prev) => {
          const nextQueue = prev.slice(1);
          // Only add more cards if limit not reached
          if (newCount < dailyLimit) {
            while (nextQueue.length < 3) {
              nextQueue.push(
                buildGlobalCard(
                  `global-${Date.now()}-${nextQueue.length}`,
                  savedCountryCode ?? undefined,
                  nextQueue.map((card) => card.countryCode)
                )
              );
            }
          } else {
            // Keep final card in queue to display lock overlay
            if (nextQueue.length === 0) {
              return prev;
            }
          }
          return nextQueue;
        });
        // Surface the limit screen only AFTER the post-vote reveal has played,
        // so the final daily swipe's approval/headline reveal is never cut off.
        if (newCount >= dailyLimit) {
          // Delay to allow lock overlay to display on final card first
          setTimeout(() => {
            setIsLimitReached(true);
          }, 1000);
        }
      }, 2500);
    }
    return allowed;
  };

  const currentCard = cardsQueue[0];
  const nextCard = cardsQueue[1];

  if (!currentCard) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-white opacity-60">Loading stack...</p>
      </div>
    );
  }

  if (isLimitReached) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4">
        <div className="space-y-4 max-w-md">
          <h2 className="text-3xl font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk']">
            Daily limit reached
          </h2>
          <p className="text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">
            You've used all your daily swipes. Come back tomorrow to vote again!
          </p>
          <div className="bg-[oklch(0.20_0.02_250)] rounded-xl p-4 border border-[oklch(0.28_0.02_250)]">
            <p className="text-sm text-[oklch(0.75_0.02_250)] font-['Inter']">
              Today's votes: {swipeCount}/{dailyLimit}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <SwipeCard
        card={currentCard}
        nextCard={nextCard}
        onVote={handleVote}
        showMicroHistory={true}
        isLocked={swipeCount >= dailyLimit && !isLimitReached}
        nextResetAt={getNextDailyResetTimestamp()}
        onShowLeaderboard={onNavigateToLeaderboard}
      />

      {/* Vote history shown top right on desktop only */}
      <div className="hidden lg:block fixed top-80 right-4 bg-[oklch(0.20_0.02_250)] p-4 rounded-lg text-[oklch(0.75_0.02_250)] text-sm max-w-xs border border-[oklch(0.28_0.02_250)] shadow-xl z-40">
        <h3 className="font-bold mb-2 text-white">Vote history</h3>
        {voteHistory.length === 0 ? (
          <p className="opacity-60 text-xs">No votes yet. Swipe to start.</p>
        ) : (
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {voteHistory.map((vote, idx) => {
              const voteLabel = vote === 'like'
                ? 'APPROVE'
                : vote === 'nolike'
                  ? 'OPPOSE'
                  : 'SKIP';
              const voteColor = vote === 'like'
                ? 'text-[oklch(0.62_0.18_142)]'
                : vote === 'nolike'
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
