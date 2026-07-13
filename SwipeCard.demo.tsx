import { useState, useEffect } from 'react';
import SwipeCard from './SwipeCard';
import type { CardData, VoteAction } from './SwipeCard.types';
import { availableCountries } from './rate-my-president-demo/src/countries';
import { getUserCountry } from './onboardingStorage';
import { getDailySwipeState, recordDailySwipe, getNextDailyResetTimestamp, isSwipeLimitReached } from './swipeLockStorage';
import { copyLinkToClipboard } from './utils/socialShare';
import { getServerUserId } from './utils/userId';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export function SwipeCardDemo() {
  const [voteHistory, setVoteHistory] = useState<VoteAction[]>([]);
  const savedCountryCode = getUserCountry();
  const hasHomeCountry = Boolean(savedCountryCode);
  const [userId, setUserId] = useState<string | null>(null);
  const [dailyState, setDailyState] = useState(() => getDailySwipeState(hasHomeCountry));
  const [nextResetAt, setNextResetAt] = useState(() => getNextDailyResetTimestamp());
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    // Initialize userId on mount
    const initUserId = async () => {
      const id = await getServerUserId(savedCountryCode);
      setUserId(id);
    };
    initUserId();
  }, [savedCountryCode]);

  useEffect(() => {
    // Sync with server when userId is available to get accurate swipe count
    if (!userId) return;

    const syncWithServer = async () => {
      try {
        const statusResponse = await fetch(`${API_BASE_URL}/api/swipes/status?userId=${userId}`);
        const statusData = await statusResponse.json();
        const today = new Date().toISOString().slice(0, 10);
        
        setDailyState({
          count: statusData.count,
          limit: statusData.limit,
          currentDay: today
        });
      } catch (error) {
        console.error('Failed to sync with server on mount:', error);
        // Fallback to local storage
        setDailyState(getDailySwipeState(hasHomeCountry));
      }
    };
    
    syncWithServer();
    
    const interval = window.setInterval(() => {
      setDailyState(getDailySwipeState(hasHomeCountry));
      setNextResetAt(getNextDailyResetTimestamp());
    }, 60000);

    return () => window.clearInterval(interval);
  }, [hasHomeCountry, userId]);

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
  const currentCard = cardsQueue[0];
  const nextCard = cardsQueue[1];

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

  const advanceQueue = () => {
    setCardsQueue((prev) => {
      const nextQueue = prev.slice(1);
      while (nextQueue.length < 3) {
        const excludedCodes = nextQueue.map((card) => card.countryCode);
        nextQueue.push(generateRandomCard(`card-${Date.now()}-${Math.random().toString(36).slice(2)}`, excludedCodes));
      }
      return nextQueue;
    });
  };

  const handleVote = async (action: VoteAction): Promise<boolean> => {
    if (isVoting) return false;
    if (!currentCard) {
      setIsVoting(false);
      return false;
    }

    setIsVoting(true);

    const voteAction = action ?? 'skip';
    console.log('Vote recorded:', voteAction);

    const userId = await getServerUserId(savedCountryCode);
    try {
      // First, check server status to ensure the swipe limit has not been reached.
      const today = new Date().toISOString().slice(0, 10);
      const statusResponse = await fetch(`${API_BASE_URL}/api/swipes/status?userId=${userId}`);
      const statusData = await statusResponse.json();

      setDailyState({
        count: statusData.count,
        limit: statusData.limit,
        currentDay: today,
      });

      if (statusData.count >= statusData.limit) {
        console.warn('Daily swipe limit reached');
        setNextResetAt(getNextDailyResetTimestamp());
        setIsVoting(false);
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/swipes/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          cardType: currentCard.type,
          action: voteAction,
        }),
      });

      const result = await response.json();

      if (result.allowed === false) {
        console.warn('Swipe not allowed by server:', result.reason);
        const statusResponse = await fetch(`${API_BASE_URL}/api/swipes/status?userId=${userId}`);
        const statusData = await statusResponse.json();
        const today = new Date().toISOString().slice(0, 10);
        setDailyState({
          count: statusData.count,
          limit: statusData.limit,
          currentDay: today,
        });
        setNextResetAt(getNextDailyResetTimestamp());
        setIsVoting(false);
        return false;
      }

      setVoteHistory((prev) => [...prev, voteAction]);
      recordDailySwipe(hasHomeCountry);
      setDailyState(getDailySwipeState(hasHomeCountry));
      setNextResetAt(getNextDailyResetTimestamp());
      setIsVoting(false);

      // Advance queue after results display (2.5 seconds to allow reveal animation)
      setTimeout(() => {
        advanceQueue();
      }, 2500);

      return true;
    } catch (error) {
      console.error('Failed to sync swipe to server:', error);
      if (isSwipeLimitReached(hasHomeCountry)) {
        console.warn('Local quota reached, not recording swipe');
        setIsVoting(false);
        return false;
      }
      setVoteHistory((prev) => [...prev, voteAction]);
      recordDailySwipe(hasHomeCountry);
      setDailyState(getDailySwipeState(hasHomeCountry));
      setNextResetAt(getNextDailyResetTimestamp());
      setIsVoting(false);

      // Advance queue after results display (2.5 seconds to allow reveal animation)
      setTimeout(() => {
        advanceQueue();
      }, 2500);

      return true;
    }
  };

  const swipeLocked = dailyState.count >= dailyState.limit;
  const remainingSwipes = Math.max(0, dailyState.limit - dailyState.count);

  const handleShareLeaderboard = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#leaderboard`;
    const success = await copyLinkToClipboard(shareUrl);
    if (success) {
      setShareNotice('Leaderboard link copied to clipboard.');
    } else {
      setShareNotice('Copy this link to share the leaderboard: ' + shareUrl);
    }
  };

  const handleShowLeaderboard = () => {
    setShareNotice('Leaderboard view not available in this demo.');
    console.log('Show leaderboard pressed');
  };

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
        isLoading={isVoting}
        isLocked={swipeLocked}
        remainingSwipes={remainingSwipes}
        nextResetAt={nextResetAt}
        onShareLeaderboard={handleShareLeaderboard}
        onShowLeaderboard={handleShowLeaderboard}
      />
      {shareNotice && (
        <div className="mt-3 rounded-2xl border border-[oklch(0.28_0.02_250)] bg-[oklch(0.18_0.03_250)] px-4 py-3 text-sm text-[oklch(0.85_0.02_250)]">
          {shareNotice}
        </div>
      )}

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
                  {vote?.toUpperCase() ?? 'SKIP'}
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
          <li>• Keyboard: L/Right = Like</li>
          <li>• Keyboard: R/Left = No Like</li>
          <li>• Keyboard: S/Up = Skip</li>
          <li>• Mobile: Haptic feedback on vote</li>
        </ul>
      </div>
    </div>
  );
}

export default SwipeCardDemo;
