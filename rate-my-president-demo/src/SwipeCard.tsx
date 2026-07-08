import React, { useState, useRef, useEffect } from 'react';
import {
  HomeIcon,
  GlobeIcon,
  ApproveIcon,
  DisapproveIcon,
  SkipIcon,
  TrendUpIcon,
  TrendDownIcon,
} from '@root/Icons';
import AnimatedFlag from '@root/AnimatedFlag';

type CardType = 'home' | 'global';
type VoteAction = 'like' | 'nolike' | 'skip' | null;

interface CardData {
  id: string;
  type: CardType;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  leaderName: string;
  avatarUrl?: string;
  approvalPercent: number;
  trend: 'up' | 'down' | 'neutral';
  headlines: Array<{ title: string; source: string; date: string; url: string }>;
  yesterdayVote?: 'like' | 'nolike' | 'skip';
}

interface SwipeCardProps {
  card: CardData;
  nextCard?: CardData;
  onVote: (action: VoteAction) => void;
  isLoading?: boolean;
  showMicroHistory?: boolean;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  card,
  onVote,
  nextCard,
  isLoading = false,
  showMicroHistory = true,
}) => {
  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const [isFlinging, setIsFlinging] = useState(false);
  const [flingAction, setFlingAction] = useState<VoteAction>(null);
  const [voteAction, setVoteAction] = useState<VoteAction>(null);
  const [showResults, setShowResults] = useState(false);
  const [revealStage, setRevealStage] = useState<'idle' | 'number' | 'confirmation' | 'news'>('idle');
  const [hoveredButton, setHoveredButton] = useState<VoteAction>(null);

  const holdTimerRef = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 120;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updatePreference);
      return () => mediaQuery.removeEventListener('change', updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  useEffect(() => {
    setVoteAction(null);
    setShowResults(false);
    setRevealStage('idle');
    setDragState({ isDragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
    setIsFlinging(false);
    setFlingAction(null);
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, [card.id]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (voteAction || isLoading || isFlinging) return;

    setDragState({ isDragging: true, startX: e.clientX, startY: e.clientY, offsetX: 0, offsetY: 0 });
    clearHoldTimer();

    if (!prefersReducedMotion) {
      holdTimerRef.current = window.setTimeout(() => {
        triggerFling('nolike');
      }, 650);
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore pointer-capture errors for unsupported browsers.
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.isDragging || voteAction || isLoading || isFlinging) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
      clearHoldTimer();
    }

    setDragState((prev) => ({ ...prev, offsetX: deltaX, offsetY: deltaY }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.isDragging) return;
    clearHoldTimer();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore pointer-capture errors for unsupported browsers.
    }

    const { offsetX, offsetY } = dragState;
    if (Math.abs(offsetX) > SWIPE_THRESHOLD && Math.abs(offsetX) > Math.abs(offsetY)) {
      triggerFling(offsetX > 0 ? 'like' : 'nolike');
    } else if (offsetY < -SWIPE_THRESHOLD && Math.abs(offsetY) > Math.abs(offsetX)) {
      triggerFling('skip');
    } else {
      setDragState({ isDragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.isDragging) return;
    clearHoldTimer();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore pointer-capture errors for unsupported browsers.
    }

    setDragState({ isDragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
  };

  const triggerFling = (action: 'like' | 'nolike' | 'skip') => {
    setIsFlinging(true);
    setFlingAction(action);

    let targetX = 0;
    let targetY = 0;
    if (action === 'like') {
      targetX = 600;
    } else if (action === 'nolike') {
      targetX = -600;
    } else {
      targetY = -800;
    }

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    setDragState((prev) => ({ ...prev, isDragging: false, offsetX: targetX, offsetY: targetY }));

    setTimeout(() => {
      setVoteAction(action);
      setShowResults(true);
      setRevealStage('number');
      setTimeout(() => setRevealStage('confirmation'), 150);
      setTimeout(() => setRevealStage('news'), 300);
      onVote(action);
      setIsFlinging(false);
      setFlingAction(null);
    }, 250);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (voteAction || isLoading || isFlinging) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleVote('like');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleVote('nolike');
          break;
        case 'ArrowUp':
        case 's':
        case 'S':
          handleVote('skip');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voteAction, isLoading, isFlinging]);

  const handleVote = (action: VoteAction) => {
    if (voteAction || isLoading || isFlinging) return;
    if (action) {
      triggerFling(action);
    }
  };

  const offsetX = dragState.offsetX;
  const offsetY = dragState.offsetY;
  const dragDistance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
  const maxDragDistance = 150;
  const interpolationProgress = Math.min(dragDistance / maxDragDistance, 1);
  const bottomScale = 0.92 + interpolationProgress * 0.08;
  const bottomTranslateY = 12 - interpolationProgress * 12;
  const bottomOpacity = 0.5 + interpolationProgress * 0.5;
  const topRotation = offsetX * 0.08;
  const topScale = isFlinging ? 1.0 : 1 - Math.min(dragDistance / 1000, 0.04);

  let likeOpacity = 0;
  let nolikeOpacity = 0;
  let skipOpacity = 0;

  if (isFlinging) {
    if (flingAction === 'like') likeOpacity = 1;
    if (flingAction === 'nolike') nolikeOpacity = 1;
    if (flingAction === 'skip') skipOpacity = 1;
  } else if (dragState.isDragging) {
    if (offsetX > 0 && offsetX > Math.abs(offsetY)) {
      likeOpacity = Math.min(offsetX / 80, 1);
    } else if (offsetX < 0 && Math.abs(offsetX) > Math.abs(offsetY)) {
      nolikeOpacity = Math.min(Math.abs(offsetX) / 80, 1);
    } else if (offsetY < 0 && Math.abs(offsetY) > Math.abs(offsetX)) {
      skipOpacity = Math.min(Math.abs(offsetY) / 80, 1);
    }
  }

  const topBgColor = card.type === 'home' ? 'bg-[oklch(0.20_0.02_245)]' : 'bg-[oklch(0.20_0.02_250)]';
  const bottomBgColor = nextCard?.type === 'home' ? 'bg-[oklch(0.20_0.02_245)]' : 'bg-[oklch(0.20_0.02_250)]';
  const percentColor = card.approvalPercent >= 50 ? 'text-[oklch(0.62_0.18_142)]' : 'text-[oklch(0.55_0.20_25)]';
  const trendColor = card.trend === 'up'
    ? 'text-[oklch(0.62_0.18_142)]'
    : card.trend === 'down'
      ? 'text-[oklch(0.55_0.20_25)]'
      : 'text-[oklch(0.75_0.02_250)]';

  const fallbackAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="%230f172a"/><circle cx="60" cy="50" r="24" fill="%23e2e8f0"/><path d="M28 104c8-18 24-26 32-26s24 8 32 26" fill="%23e2e8f0"/></svg>';

  const renderCardContent = (cardData: CardData, isBottom = false) => {
    return (
      <div className="h-full flex flex-col justify-between relative">
        <div className="absolute top-0 right-0 flex items-center gap-2 text-[oklch(0.75_0.02_250)] text-xs font-medium opacity-60">
          <div className="w-4 h-4 text-[oklch(0.75_0.02_250)]">
            {cardData.type === 'home' ? (
              <HomeIcon aria-label="Home" />
            ) : (
              <GlobeIcon aria-label="Global" />
            )}
          </div>
          <AnimatedFlag countryCode={cardData.countryCode} fallbackFlag={cardData.countryFlag} className="w-5 h-5" />
          <img
            src={cardData.avatarUrl || fallbackAvatar}
            alt={`${cardData.leaderName} avatar`}
            onError={(event) => { (event.currentTarget as HTMLImageElement).src = fallbackAvatar; }}
            className="w-[120px] h-[120px] rounded-avatar-hero object-cover border-2 border-[oklch(0.28_0.02_250)]"
          />
        </div>

        <h2 className="text-center text-2xl font-semibold text-[oklch(0.95_0.02_250)] mb-4 font-['Space_Grotesk'] leading-tight">
          {cardData.leaderName}
        </h2>

        <p className="text-center text-sm text-[oklch(0.75_0.02_250)] opacity-50 font-['Space_Grotesk']">
          {isBottom ? 'Up next...' : 'Swipe left or right to vote'}
        </p>
      </div>
    );
  };

  const cardTransitionStyle = prefersReducedMotion ? 'none' : dragState.isDragging ? 'none' : isFlinging ? 'transform 0.25s ease-out' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[oklch(0.15_0.04_250)] p-4">
      {!showResults && (
        <div className={`w-80 md:w-[480px] transition-all duration-150 ${voteAction ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
          <div className="relative w-80 md:w-[480px] h-[320px] mb-6">
            {nextCard && (
              <div
                className={`absolute inset-0 rounded-[12px] p-6 select-none pointer-events-none ${bottomBgColor} border border-[oklch(0.28_0.02_250)] shadow-xl`}
                style={{
                  transform: `scale(${bottomScale}) translateY(${bottomTranslateY}px)`,
                  opacity: bottomOpacity,
                  zIndex: 10,
                }}
              >
                {renderCardContent(nextCard, true)}
              </div>
            )}

            <div
              role="region"
              aria-label="Daily leader card"
              className={`absolute inset-0 rounded-[12px] p-6 cursor-grab select-none ${topBgColor} border border-[oklch(0.28_0.02_250)] shadow-2xl ${dragState.isDragging ? 'cursor-grabbing' : ''} ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              style={{
                transform: `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${topRotation}deg) scale(${topScale})`,
                transition: cardTransitionStyle,
                zIndex: 20,
                touchAction: 'none',
              }}
            >
              <div
                style={{ opacity: likeOpacity }}
                className="border-4 border-[oklch(0.62_0.18_142)] text-[oklch(0.62_0.18_142)] text-2xl font-bold uppercase rounded-lg px-3 py-1 tracking-widest absolute top-8 left-6 rotate-[-12deg] pointer-events-none z-30 transition-opacity duration-75"
              >
                LIKE
              </div>
              <div
                style={{ opacity: nolikeOpacity }}
                className="border-4 border-[oklch(0.55_0.20_25)] text-[oklch(0.55_0.20_25)] text-2xl font-bold uppercase rounded-lg px-3 py-1 tracking-widest absolute top-8 right-6 rotate-[12deg] pointer-events-none z-30 transition-opacity duration-75"
              >
                NO LIKE
              </div>
              <div
                style={{ opacity: skipOpacity }}
                className="border-4 border-[oklch(0.72_0.15_65)] text-[oklch(0.72_0.15_65)] text-2xl font-bold uppercase rounded-lg px-4 py-1 tracking-widest absolute bottom-12 left-1/2 -translate-x-1/2 rotate-0 pointer-events-none z-30 transition-opacity duration-75"
              >
                SKIP
              </div>

              {renderCardContent(card, false)}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 mt-6 w-full">
            {/* Primary tier: No Like and Like */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleVote('nolike')}
                onMouseEnter={() => setHoveredButton('nolike')}
                onMouseLeave={() => setHoveredButton(null)}
                disabled={isLoading || voteAction !== null || isFlinging}
                className={`hidden md:flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-all duration-100 font-['Space_Grotesk'] ${hoveredButton === 'nolike' ? 'bg-[oklch(0.55_0.20_25)] text-white' : 'bg-transparent text-[oklch(0.55_0.20_25)] border border-[oklch(0.55_0.20_25)]'}`}
                aria-label="No Like"
              >
                <span aria-hidden="true" className="inline-flex">
                  <DisapproveIcon className="w-4 h-4" />
                </span>
                No Like
              </button>
              <button
                onClick={() => handleVote('nolike')}
                disabled={isLoading || voteAction !== null || isFlinging}
                className="md:hidden w-12 h-12 flex items-center justify-center rounded-lg bg-[oklch(0.28_0.02_250)] text-[oklch(0.55_0.20_25)] opacity-60 hover:opacity-100 transition-opacity"
                aria-label="No Like"
              >
                <span aria-hidden="true" className="inline-flex">
                  <DisapproveIcon className="w-6 h-6" />
                </span>
              </button>
              <button
                onClick={() => handleVote('like')}
                onMouseEnter={() => setHoveredButton('like')}
                onMouseLeave={() => setHoveredButton(null)}
                disabled={isLoading || voteAction !== null || isFlinging}
                className={`hidden md:flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-all duration-100 font-['Space_Grotesk'] ${hoveredButton === 'like' ? 'bg-[oklch(0.62_0.18_142)] text-white' : 'bg-transparent text-[oklch(0.62_0.18_142)] border border-[oklch(0.62_0.18_142)]'}`}
                aria-label="Like"
              >
                <span aria-hidden="true" className="inline-flex">
                  <ApproveIcon className="w-4 h-4" />
                </span>
                Like
              </button>
              <button
                onClick={() => handleVote('like')}
                disabled={isLoading || voteAction !== null || isFlinging}
                className="md:hidden w-12 h-12 flex items-center justify-center rounded-lg bg-[oklch(0.28_0.02_250)] text-[oklch(0.62_0.18_142)] opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Like"
              >
                <span aria-hidden="true" className="inline-flex">
                  <ApproveIcon className="w-6 h-6" />
                </span>
              </button>
            </div>
            {/* Secondary tier: Skip (centered below) */}
            <button
              onClick={() => handleVote('skip')}
              onMouseEnter={() => setHoveredButton('skip')}
              onMouseLeave={() => setHoveredButton(null)}
              disabled={isLoading || voteAction !== null || isFlinging}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-all duration-100 font-['Space_Grotesk'] ${hoveredButton === 'skip' ? 'bg-[oklch(0.28_0.02_250)] text-[oklch(0.75_0.02_250)]' : 'bg-transparent text-[oklch(0.75_0.02_250)] opacity-50'}`}
              aria-label="Skip"
            >
              <span aria-hidden="true" className="inline-flex">
                <SkipIcon className="w-4 h-4" />
              </span>
              Skip
            </button>
          </div>
          <p className="mt-4 text-center text-sm text-[oklch(0.75_0.02_250)] opacity-80 font-['Space_Grotesk']">
            {voteAction ? 'Today’s vote is locked in.' : 'Press and hold to no-like, or swipe to vote.'}
          </p>
        </div>
      )}

      {showResults && (
        <div className={`w-80 md:w-[480px] ${topBgColor} rounded-[12px] p-6 border border-[oklch(0.28_0.02_250)] shadow-2xl transition-all duration-300 ${showResults ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className={`transition-all duration-300 ${revealStage === 'idle' ? 'opacity-0' : 'opacity-100'}`}>
            <div className="text-center mb-2">
              <div className={`text-5xl font-bold ${percentColor} font-['Inter']`}>{card.approvalPercent}%</div>
              <div className={`text-2xl ${trendColor}`}>
                {card.trend === 'up' ? (
                  <TrendUpIcon aria-label="Trend up" />
                ) : card.trend === 'down' ? (
                  <TrendDownIcon aria-label="Trend down" />
                ) : (
                  <span className="inline-block">→</span>
                )}
              </div>
            </div>
          </div>

          {revealStage !== 'idle' && revealStage !== 'number' && (
            <div className={`transition-all duration-300 text-center text-lg text-[oklch(0.95_0.02_250)] mb-4 font-['Space_Grotesk'] ${revealStage === 'confirmation' || revealStage === 'news' ? 'opacity-100' : 'opacity-0'}`}>
              Your opinion has been counted.
            </div>
          )}

          {showMicroHistory && card.yesterdayVote && revealStage === 'news' && (
            <div className="text-center text-xs text-[oklch(0.75_0.02_250)] opacity-60 mb-4 font-['Inter']">
              Yesterday:{' '}
              <span className="inline-block w-4 h-4 align-text-bottom">
                {card.yesterdayVote === 'like' ? (
                  <span aria-hidden="true" className="inline-flex">
                    <ApproveIcon />
                  </span>
                ) : card.yesterdayVote === 'nolike' ? (
                  <span aria-hidden="true" className="inline-flex">
                    <DisapproveIcon />
                  </span>
                ) : (
                  <span aria-hidden="true" className="inline-flex">
                    <SkipIcon />
                  </span>
                )}
              </span>{' '}
              {card.yesterdayVote === 'like' ? 'Like' : card.yesterdayVote === 'nolike' ? 'No Like' : 'Skip'}
            </div>
          )}

          {revealStage === 'news' && (
            <div className="space-y-2">
              {card.headlines.slice(0, 2).map((headline: { title: string; source: string; date: string; url: string }, idx: number) => (
                <a
                  key={idx}
                  href={headline.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-[oklch(0.75_0.02_250)] hover:text-[oklch(0.95_0.02_250)] transition-colors font-['Space_Grotesk']"
                >
                  <div className="font-medium">{headline.title}</div>
                  <div className="text-xs opacity-60 font-['Inter']">{headline.source} · {headline.date}</div>
                </a>
              ))}
              {card.headlines.length === 0 && (
                <p className="text-sm text-[oklch(0.75_0.02_250)] opacity-60 text-center font-['Space_Grotesk']">No recent qualifying coverage</p>
              )}
            </div>
          )}

          {revealStage === 'news' && (
            <p className="text-center text-xs text-[oklch(0.75_0.02_250)] opacity-40 mt-6 font-['Space_Grotesk']">Swipe or tap next card to advance</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SwipeCard;
