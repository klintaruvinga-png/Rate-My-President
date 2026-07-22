import { useState, useEffect } from 'react';
import SwipeCard from './SwipeCard';
import type { CardData, VoteAction, CardType } from './SwipeCard.types';
import type { President, SwipeStatus } from './api/client';
import { availableCountries } from './countries';
import { getNextDailyResetTimestamp } from '@root/swipeLockStorage';

// ── helpers ───────────────────────────────────────────────────────────────────

const makeAvatarUrl = (seed: string, color: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=${color}`;

const today = new Date().toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

// Country code from a DB president row (home_country) may be null/uppercase;
// normalize to match availableCountries.code.
function normalizeCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return code.toUpperCase();
}

// Build a real CardData from a DB president row, bridged to the curated
// availableCountries entry (which carries display name, flag, and avatar).
// The card id is the REAL DB president id so votes persist against real rows.
function buildCardFromPresident(president: President, type: CardType): CardData | null {
  if (president.id === undefined || president.id === null) return null;
  const code = normalizeCode(president.home_country);
  const country = code ? availableCountries.find((c) => c.code === code) : undefined;
  const leaderName = president.name ?? country?.leader ?? 'Unknown';
  const avatarUrl =
    country?.avatarUrl ?? makeAvatarUrl(president.name ?? code ?? 'X', '2f4f4f');

  return {
    id: String(president.id),
    type,
    countryCode: country?.code ?? code ?? '',
    countryName: country?.name ?? '',
    countryFlag: country?.flag ?? '',
    leaderName,
    avatarUrl,
    headerImageUrl: avatarUrl,
    approvalPercent: 0,
    trend: 'neutral',
    headlines: country
      ? [
          {
            title: `${leaderName} in the news`,
            source: 'Reuters',
            date: today,
            url: 'https://reuters.com',
          },
        ]
      : [],
    yesterdayVote: undefined,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build the day's queue from real presidents: the user's home leader first
// (if present), then global leaders up to the server-reported remaining count.
function buildQueue(presidents: President[], homeCode: string | null, remaining: number): CardData[] {
  if (!presidents.length || remaining <= 0) return [];

  const normHome = normalizeCode(homeCode);
  const homePresident = normHome
    ? presidents.find((p) => normalizeCode(p.home_country) === normHome)
    : undefined;

  const globals = shuffle(presidents.filter((p) => normalizeCode(p.home_country) !== normHome));

  const queue: CardData[] = [];
  if (homePresident) {
    const homeCard = buildCardFromPresident(homePresident, 'home');
    if (homeCard) queue.push(homeCard);
  }
  for (const p of globals) {
    if (queue.length >= remaining) break;
    const card = buildCardFromPresident(p, 'global');
    if (card) queue.push(card);
  }
  return queue;
}

// ── component ─────────────────────────────────────────────────────────────────

export function SwipeCardDemo({
  presidents = [],
  homeCountryCode = null,
  swipeStatus = null,
  onNavigateToLeaderboard,
  onSwipe,
}: {
  presidents?: President[];
  homeCountryCode?: string | null;
  swipeStatus?: SwipeStatus | null;
  onNavigateToLeaderboard?: () => void;
  onSwipe?: (action: VoteAction, cardId: string, cardType: 'home' | 'global') => void;
} = {}) {
  const dailyLimit = swipeStatus?.limit ?? (homeCountryCode ? 2 : 1);
  const used = swipeStatus?.used ?? 0;
  const locked = swipeStatus?.locked ?? used >= dailyLimit;
  const remaining = swipeStatus?.remaining ?? Math.max(0, dailyLimit - used);

  const [voteHistory, setVoteHistory] = useState<VoteAction[]>([]);
  const [cardsQueue, setCardsQueue] = useState<CardData[]>(() =>
    buildQueue(presidents, homeCountryCode, remaining || 1)
  );
  const [isLimitReached, setIsLimitReached] = useState(locked);

  // Rebuild the queue when real data / lock state arrives from the server.
  useEffect(() => {
    setIsLimitReached(locked);
    if (!locked && presidents.length) {
      setCardsQueue(buildQueue(presidents, homeCountryCode, remaining || 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presidents, homeCountryCode, locked, remaining]);

  const handleVote = (action: VoteAction): boolean => {
    const voteAction = action ?? 'skip';
    const currentCard = cardsQueue[0];
    if (!currentCard) return false;

    setVoteHistory((prev) => [...prev, voteAction]);
    if (onSwipe) {
      onSwipe(voteAction, currentCard.id, currentCard.type);
    }

    // Animate the reveal, then advance the queue. The server is the source of
    // truth for the lock (swipeStatus), so we only refill what's allowed.
    setTimeout(() => {
      setCardsQueue((prev) => {
        const nextQueue = prev.slice(1);
        const newUsed = used + voteHistory.length + 1;
        if (!locked && newUsed < dailyLimit && presidents.length) {
          const more = buildQueue(
            presidents,
            homeCountryCode,
            Math.max(0, dailyLimit - newUsed)
          );
          // Append one fresh card if we're below the on-screen buffer.
          if (nextQueue.length < 1 && more.length) {
            nextQueue.push(more[0]);
          }
        }
        return nextQueue;
      });
      // If the server now reports the limit reached, show the lock overlay.
      if (remaining <= 1) {
        setTimeout(() => setIsLimitReached(true), 600);
      }
    }, 2500);

    return true;
  };

  const currentCard = cardsQueue[0];
  const nextCard = cardsQueue[1];

  if (!currentCard && !locked) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-white opacity-60">Loading stack...</p>
      </div>
    );
  }

  if (isLimitReached || locked) {
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
              Today's votes: {used}/{dailyLimit}
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
        isLocked={false}
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
              const voteLabel =
                vote === 'like' ? 'APPROVE' : vote === 'nolike' ? 'OPPOSE' : 'SKIP';
              const voteColor =
                vote === 'like'
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
                  <span className={`font-semibold ${voteColor}`}>{voteLabel}</span>
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
