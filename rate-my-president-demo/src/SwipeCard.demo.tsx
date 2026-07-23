import { useState, useEffect } from 'react';
import SwipeCard from './SwipeCard';
import type { CardData, VoteAction, CardType } from './SwipeCard.types';
import type { President, SwipeStatusView } from './api/client';
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

// Country code from a DB president row's `country` field (a NAME, e.g.
// "United States"); resolve to the curated availableCountries entry (which
// carries display name, flag, avatar) by matching on country name.
function countryEntryFromName(name: string | null | undefined) {
  if (!name) return undefined;
  return availableCountries.find((c) => c.name === name);
}

// Build a real CardData from a DB president row, bridged to the curated
// availableCountries entry. The card id is the REAL DB president id so votes
// persist against real rows. `approvalRate` (optional) carries the live
// aggregate approval % from the leaderboard so the results reveal is real.
function buildCardFromPresident(president: President, type: CardType, approvalRate?: number): CardData | null {
  if (president.id === undefined || president.id === null) return null;
  const country = countryEntryFromName(president.country);
  const leaderName = president.name ?? country?.leader ?? 'Unknown';
  const avatarUrl =
    country?.avatarUrl ?? makeAvatarUrl(president.name ?? country?.code ?? 'X', '2f4f4f');

  return {
    id: String(president.id),
    type,
    countryCode: country?.code ?? '',
    countryName: country?.name ?? '',
    countryFlag: country?.flag ?? '',
    leaderName,
    avatarUrl,
    headerImageUrl: avatarUrl,
    approvalPercent: typeof approvalRate === 'number' && !Number.isNaN(approvalRate) ? approvalRate : 0,
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
// Home matching compares the user's stored country CODE (e.g. 'US') against
// each president's resolved country code (derived from its country NAME).
// `approvalRates` maps presidentId -> live approval % (from the leaderboard).
function buildQueue(
  presidents: President[],
  homeCode: string | null,
  remaining: number,
  approvalRates?: Record<string, number>,
): CardData[] {
  if (!presidents.length || remaining <= 0) return [];

  const normHome = homeCode ? homeCode.toUpperCase() : null;
  const homePresident = normHome
    ? presidents.find((p) => countryEntryFromName(p.country)?.code === normHome)
    : undefined;

  const globals = shuffle(presidents.filter((p) => countryEntryFromName(p.country)?.code !== normHome));

  const queue: CardData[] = [];
  if (homePresident) {
    const homeCard = buildCardFromPresident(
      homePresident,
      'home',
      approvalRates?.[String(homePresident.id)],
    );
    if (homeCard) queue.push(homeCard);
  }
  for (const p of globals) {
    if (queue.length >= remaining) break;
    const card = buildCardFromPresident(p, 'global', approvalRates?.[String(p.id)]);
    if (card) queue.push(card);
  }
  return queue;
}

// ── component ─────────────────────────────────────────────────────────────────

export function SwipeCardDemo({
  presidents = [],
  homeCountryCode = null,
  swipeStatus = null,
  approvalRates,
  onNavigateToLeaderboard,
  onSwipe,
}: {
  presidents?: President[];
  homeCountryCode?: string | null;
  swipeStatus?: SwipeStatusView | null;
  onNavigateToLeaderboard?: () => void;
  onSwipe?: (action: VoteAction, cardId: string, cardType: 'home' | 'global') => Promise<boolean | string> | void;
  /** Live approval % per presidentId, from the leaderboard. */
  approvalRates?: Record<string, number>;
} = {}) {
  const dailyLimit = swipeStatus?.limit ?? (homeCountryCode ? 2 : 1);
  const used = swipeStatus?.used ?? 0;
  const locked = swipeStatus?.locked ?? used >= dailyLimit;
  const remaining = swipeStatus?.remaining ?? Math.max(0, dailyLimit - used);

  const [voteHistory, setVoteHistory] = useState<VoteAction[]>([]);
  const [cardsQueue, setCardsQueue] = useState<CardData[]>(() =>
    buildQueue(presidents, homeCountryCode, remaining || 1, approvalRates)
  );
  const [isLimitReached, setIsLimitReached] = useState(locked);
  const [swipeError, setSwipeError] = useState<string | null>(null);

  // Rebuild the queue when real data / lock state arrives from the server.
  useEffect(() => {
    setIsLimitReached(locked);
    if (!locked && presidents.length) {
      setCardsQueue(buildQueue(presidents, homeCountryCode, remaining || 1, approvalRates));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presidents, homeCountryCode, locked, remaining]);

  const handleVote = (action: VoteAction): boolean => {
    const voteAction = action ?? 'skip';
    const currentCard = cardsQueue[0];
    if (!currentCard) return false;

    setVoteHistory((prev) => [...prev, voteAction]);
    setSwipeError(null);

    // Persist to the server and only advance the queue if it succeeds.
    // This prevents the "queue freezes / skips on error" bug: a failed swipe
    // keeps the current card so the user can retry.
    //
    // onSwipe resolves to:
    //   true            -> accepted (server source of truth for the lock)
    //   false           -> silent/network failure (keep card, generic retry msg)
    //   string          -> user-facing reason (e.g. daily limit reached)
    // The remaining-count is owned by the server; App.refreshSwipeStatus() runs
    // after each swipe and the effect above rebuilds the queue from `remaining`,
    // so we never recompute used/voteHistory locally (was a stale-closure race).
    const persist = async () => {
      try {
        const ok = onSwipe ? await onSwipe(voteAction, currentCard.id, currentCard.type) : true;
        if (ok !== true) {
          setSwipeError(typeof ok === 'string' ? ok : 'Vote could not be saved. Please try again.');
          return;
        }
        // Advance the queue. Server drives the lock; the swipeStatus effect
        // rebuilds remaining cards when `remaining` changes.
        setCardsQueue((prev) => prev.slice(1));
        if (remaining <= 1) {
          setTimeout(() => setIsLimitReached(true), 600);
        }
      } catch (err) {
        console.error('Swipe persist error:', err);
        setSwipeError('Vote could not be saved. Please try again.');
      }
    };
    void persist();

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
      {swipeError && (
        <div
          role="alert"
          className="mb-2 rounded-lg border border-[oklch(0.55_0.20_25)] bg-[oklch(0.30_0.10_25)] px-3 py-2 text-sm text-[oklch(0.85_0.08_25)]"
        >
          {swipeError}
        </div>
      )}

      <SwipeCard
        card={currentCard}
        nextCard={nextCard}
        onVote={handleVote}
        showMicroHistory={true}
        isLocked={locked || isLimitReached}
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
