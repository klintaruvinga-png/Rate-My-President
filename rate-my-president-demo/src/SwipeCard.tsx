import React, { useState, useRef, useEffect } from 'react';
import {
  HomeIcon,
  GlobeIcon,
  LikeIcon,
  NoLikeIcon,
  SkipIcon,
  TrendUpIcon,
  TrendDownIcon,
} from '@root/Icons';
import AnimatedFlag from '@root/AnimatedFlag';
import type { CardData, VoteAction } from './SwipeCard.types';

interface SwipeCardProps {
  card: CardData;
  nextCard?: CardData;
  onVote: (action: VoteAction) => void;
  isLoading?: boolean;
  showMicroHistory?: boolean;
  headerImageUrl?: string;
  totalRated?: number;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  card,
  onVote,
  nextCard,
  isLoading = false,
  showMicroHistory = true,
  headerImageUrl,
  totalRated,
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

  const renderCardContent = (cardData: CardData) => {
    const headerImage = cardData.headerImageUrl || headerImageUrl || cardData.avatarUrl || '/assets/Obama Header No BG.png';
    
    return (
      <div className="h-full flex flex-col relative overflow-hidden rounded-t-[20px]">
        {/* Full Bleed Header Image (60-70% of card) */}
        <div className="relative h-[65%] w-full">
          <img
            src={headerImage}
            alt={cardData.leaderName}
            className="w-full h-full object-cover"
            onError={(event) => { (event.currentTarget as HTMLImageElement).src = fallbackAvatar; }}
          />
          
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.15_0.04_250)] via-transparent to-transparent" />
          
          {/* Top Left: Home/Global Icon Badge */}
          <div className="absolute top-4 left-4 w-4 h-4 text-[oklch(0.75_0.02_250)]">
            {cardData.type === 'home' ? (
              <HomeIcon aria-label="Home" />
            ) : (
              <GlobeIcon aria-label="Global" />
            )}
          </div>

          {/* Top Right: Country Badge */}
          <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 flex items-center gap-2">
            <AnimatedFlag countryCode={cardData.countryCode} fallbackFlag={cardData.countryFlag} className="w-5 h-5" />
            <span className="text-white text-sm font-medium font-['Inter']">{cardData.countryName}</span>
          </div>

          {/* Overlay Information on Image */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 font-['Space_Grotesk'] leading-tight drop-shadow-lg">
              {cardData.leaderName}
            </h2>
            {cardData.officeTitle && (
              <p className="text-white/90 text-base md:text-lg font-['Inter'] mb-1">{cardData.officeTitle}</p>
            )}
            {cardData.party && (
              <p className="text-white/70 text-sm md:text-base font-['Inter']">{cardData.party}</p>
            )}
          </div>
        </div>

        {/* Bottom Section - Buttons */}
        <div className="flex-1 max-h-[160px] flex flex-col items-center justify-center px-4 py-4">
          <div className="flex justify-center gap-4 md:gap-6 lg:gap-8">
            {/* No Like button */}
            <button
              onClick={() => handleVote('nolike')}
              onMouseEnter={() => setHoveredButton('nolike')}
              onMouseLeave={() => setHoveredButton(null)}
              disabled={isLoading || voteAction !== null || isFlinging}
              className={`w-11 h-11 md:w-16 md:h-16 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 font-['Space_Grotesk'] ${
                hoveredButton === 'nolike'
                  ? 'bg-[oklch(0.55_0.20_25)] text-white scale-110'
                  : 'bg-[oklch(0.28_0.02_250)] text-[oklch(0.55_0.20_25)] border-2 border-[oklch(0.55_0.20_25)] hover:scale-105'
              }`}
              aria-label="No Like"
            >
              <span aria-hidden="true" className="inline-flex">
                <NoLikeIcon className="w-5 h-5 md:w-8 md:h-8" />
              </span>
            </button>

            {/* Skip button */}
            <button
              onClick={() => handleVote('skip')}
              onMouseEnter={() => setHoveredButton('skip')}
              onMouseLeave={() => setHoveredButton(null)}
              disabled={isLoading || voteAction !== null || isFlinging}
              className={`w-11 h-11 md:w-16 md:h-16 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 font-['Space_Grotesk'] ${
                hoveredButton === 'skip'
                  ? 'bg-[oklch(0.72_0.15_65)] text-white scale-110'
                  : 'bg-[oklch(0.28_0.02_250)] text-[oklch(0.72_0.15_65)] border-2 border-[oklch(0.72_0.15_65)] opacity-70 hover:opacity-100 hover:scale-105'
              }`}
              aria-label="Skip"
            >
              <span aria-hidden="true" className="inline-flex">
                <SkipIcon className="w-5 h-5 md:w-8 md:h-8" />
              </span>
            </button>

            {/* Like button */}
            <button
              onClick={() => handleVote('like')}
              onMouseEnter={() => setHoveredButton('like')}
              onMouseLeave={() => setHoveredButton(null)}
              disabled={isLoading || voteAction !== null || isFlinging}
              className={`w-11 h-11 md:w-16 md:h-16 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 font-['Space_Grotesk'] ${
                hoveredButton === 'like'
                  ? 'bg-[oklch(0.62_0.18_142)] text-white scale-110'
                  : 'bg-[oklch(0.28_0.02_250)] text-[oklch(0.62_0.18_142)] border-2 border-[oklch(0.62_0.18_142)] hover:scale-105'
              }`}
              aria-label="Like"
            >
              <span aria-hidden="true" className="inline-flex">
                <LikeIcon className="w-5 h-5 md:w-8 md:h-8" />
              </span>
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-[oklch(0.75_0.02_250)] opacity-60 font-['Space_Grotesk']">
            {voteAction ? "Today's vote is locked in." : 'Press and hold to no-like, or swipe to vote.'}
          </p>
        </div>
      </div>
    );
  };

  const cardTransitionStyle = prefersReducedMotion ? 'none' : dragState.isDragging ? 'none' : isFlinging ? 'transform 0.25s ease-out' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

  return (
    <div className="flex flex-col items-center relative h-full">
      {/* Vote History Pill */}
      {totalRated !== undefined && totalRated > 0 && (
        <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-[oklch(0.20_0.02_250)]/80 backdrop-blur-sm border border-[oklch(0.28_0.02_250)] rounded-full px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-[oklch(0.75_0.02_250)] font-['Inter'] flex items-center gap-2">
          <span>🗳️</span>
          <span>{totalRated} Rated</span>
        </div>
      )}

      {!showResults && (
        <div className={`flex flex-col items-center gap-2 w-full transition-all duration-150 ${voteAction ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
          <div className="relative w-[92vw] sm:w-[85vw] md:w-[75vw] lg:w-[420px] max-w-[460px] aspect-[3/4] mx-auto" style={{ boxSizing: 'border-box' }}>
            {nextCard && (
              <div
                className={`absolute inset-0 rounded-[20px] select-none pointer-events-none ${bottomBgColor} border border-[oklch(0.28_0.02_250)] shadow-xl`}
                style={{
                  transform: `scale(${bottomScale}) translateY(${bottomTranslateY}px)`,
                  opacity: bottomOpacity,
                  zIndex: 10,
                }}
              >
                {renderCardContent(nextCard)}
              </div>
            )}

            <div
              role="region"
              aria-label="Daily leader card"
              className={`absolute inset-0 rounded-[20px] cursor-grab select-none overflow-hidden ${topBgColor} border border-[oklch(0.28_0.02_250)] shadow-2xl backdrop-blur-sm ${dragState.isDragging ? 'cursor-grabbing' : ''} ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
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

              {renderCardContent(card)}
            </div>
          </div>
        </div>
      )}

      {showResults && (
        <div className={`w-[92vw] sm:w-[85vw] md:w-[75vw] lg:w-[420px] max-w-[460px] ${topBgColor} rounded-[20px] p-6 border border-[oklch(0.28_0.02_250)] shadow-2xl backdrop-blur-sm transition-all duration-300 ${showResults ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
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
                    <LikeIcon />
                  </span>
                ) : card.yesterdayVote === 'nolike' ? (
                  <span aria-hidden="true" className="inline-flex">
                    <NoLikeIcon />
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
