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

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('button, a, input, select, textarea, [role="button"], [data-interactive="true"]'));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (voteAction || isLoading || isFlinging) return;
    if (isInteractiveTarget(e.target)) return;

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
      setTimeout(() => setRevealStage('news'), 800);
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

  const stopCardGesture = (event: React.SyntheticEvent) => {
    event.stopPropagation();
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
      <div className="flex flex-col relative overflow-hidden rounded-t-[20px]">
        {/* Full Bleed Header Image */}
        <div className="relative h-[300px] w-full shrink-0 border-b border-[oklch(0.28_0.02_250)] sm:h-[340px] md:h-[360px]">
          <img
            src={headerImage}
            alt={cardData.leaderName}
            className="w-full h-full object-cover"
            onError={(event) => { (event.currentTarget as HTMLImageElement).src = fallbackAvatar; }}
          />
          
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
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent px-3 pb-4 pt-12 sm:px-5 sm:pb-6 sm:pt-16">
            <h2 className="mb-2 text-xl font-bold leading-snug text-white font-['Space_Grotesk'] drop-shadow-lg sm:text-2xl md:text-3xl">
              {cardData.leaderName}
            </h2>
            {cardData.officeTitle && (
              <p className="mb-1 text-sm font-['Inter'] text-white/90 drop-shadow-md sm:text-base md:text-lg">{cardData.officeTitle}</p>
            )}
            {cardData.party && (
              <p className="text-sm font-['Inter'] text-white/80 drop-shadow-md sm:text-base md:text-base">{cardData.party}</p>
            )}
          </div>
        </div>

        {/* Bottom Section - Buttons */}
        <div className="flex min-h-[72px] flex-col items-center justify-center px-3 py-6 sm:min-h-[96px] sm:px-5 sm:py-6 md:py-8">
          <div className="flex justify-center gap-4 md:gap-6 lg:gap-8 mt-0 sm:mt-0">
            {/* No Like button */}
            <button
              type="button"
              onClick={(event) => {
                stopCardGesture(event);
                handleVote('nolike');
              }}
              onPointerDown={stopCardGesture}
              onMouseDown={stopCardGesture}
              onTouchStart={stopCardGesture}
              onMouseEnter={() => setHoveredButton('nolike')}
              onMouseLeave={() => setHoveredButton(null)}
              disabled={isLoading || voteAction !== null || isFlinging}
              className={`flex h-12 w-12 min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-all duration-200 active:scale-95 active:translate-y-[1px] font-['Space_Grotesk'] sm:h-14 sm:w-14 md:h-16 md:w-16 ${
                hoveredButton === 'nolike'
                  ? 'bg-[oklch(0.55_0.20_25)] text-white scale-110'
                  : 'bg-[oklch(0.28_0.02_250)] text-[oklch(0.55_0.20_25)] border-2 border-[oklch(0.55_0.20_25)] hover:scale-105'
              }`}
              aria-label="No Like"
            >
              <span aria-hidden="true" className="inline-flex">
                <NoLikeIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
              </span>
            </button>

            {/* Skip button */}
            <button
              type="button"
              onClick={(event) => {
                stopCardGesture(event);
                handleVote('skip');
              }}
              onPointerDown={stopCardGesture}
              onMouseDown={stopCardGesture}
              onTouchStart={stopCardGesture}
              onMouseEnter={() => setHoveredButton('skip')}
              onMouseLeave={() => setHoveredButton(null)}
              disabled={isLoading || voteAction !== null || isFlinging}
              className={`flex h-12 w-12 min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-all duration-200 active:scale-95 active:translate-y-[1px] font-['Space_Grotesk'] sm:h-14 sm:w-14 md:h-16 md:w-16 ${
                hoveredButton === 'skip'
                  ? 'bg-[oklch(0.72_0.15_65)] text-white scale-110'
                  : 'bg-[oklch(0.28_0.02_250)] text-[oklch(0.72_0.15_65)] border-2 border-[oklch(0.72_0.15_65)] opacity-70 hover:opacity-100 hover:scale-105'
              }`}
              aria-label="Skip"
            >
              <span aria-hidden="true" className="inline-flex">
                <SkipIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
              </span>
            </button>

            {/* Like button */}
            <button
              type="button"
              onClick={(event) => {
                stopCardGesture(event);
                handleVote('like');
              }}
              onPointerDown={stopCardGesture}
              onMouseDown={stopCardGesture}
              onTouchStart={stopCardGesture}
              onMouseEnter={() => setHoveredButton('like')}
              onMouseLeave={() => setHoveredButton(null)}
              disabled={isLoading || voteAction !== null || isFlinging}
              className={`flex h-12 w-12 min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-all duration-200 active:scale-95 active:translate-y-[1px] font-['Space_Grotesk'] sm:h-14 sm:w-14 md:h-16 md:w-16 ${
                hoveredButton === 'like'
                  ? 'bg-[oklch(0.62_0.18_142)] text-white scale-110'
                  : 'bg-[oklch(0.28_0.02_250)] text-[oklch(0.62_0.18_142)] border-2 border-[oklch(0.62_0.18_142)] hover:scale-105'
              }`}
              aria-label="Like"
            >
              <span aria-hidden="true" className="inline-flex">
                <LikeIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
              </span>
            </button>
          </div>
          <p className="mt-2 w-full max-w-[240px] text-center text-[0.68rem] leading-3 text-[oklch(0.75_0.02_250)]/70 font-['Space_Grotesk'] sm:mt-3 sm:max-w-none sm:text-[0.75rem] sm:leading-4">
            {voteAction ? "Today's vote is locked in." : 'Press and hold to no-like, or swipe to vote.'}
          </p>
        </div>
      </div>
    );
  };

  const cardTransitionStyle = prefersReducedMotion ? 'none' : dragState.isDragging ? 'none' : isFlinging ? 'transform 0.25s ease-out' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

  return (
    <div className="flex h-full flex-col items-center justify-center relative overflow-hidden touch-none pt-0 sm:pt-1">
      {/* Vote History Pill */}
      {totalRated !== undefined && totalRated > 0 && (
        <div className="absolute right-2 top-2 flex items-center gap-2 rounded-full border border-[oklch(0.28_0.02_250)] bg-[oklch(0.20_0.02_250)]/80 px-3 py-1.5 text-xs font-['Inter'] text-[oklch(0.75_0.02_250)] backdrop-blur-sm md:right-4 md:top-4 md:px-4 md:py-2 md:text-sm">
          <span className="text-[oklch(0.62_0.18_142)]">•</span>
          <span>{totalRated} Rated</span>
        </div>
      )}

      {!showResults && (
        <div className={`flex w-full flex-col items-center gap-2 transition-all duration-150 ${voteAction ? 'pointer-events-none scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
          <div className="relative mx-auto h-[54dvh] min-h-[420px] w-full max-w-[420px] sm:h-[60dvh] sm:min-h-[480px] md:h-[580px] md:max-w-[450px]" style={{ boxSizing: 'border-box' }}>
            {nextCard && (
              <div
                className={`absolute inset-0 rounded-[20px] select-none pointer-events-none ${bottomBgColor} border border-[oklch(0.28_0.02_250)] shadow-xl`}
                style={{
                  transform: `scale(${bottomScale}) translateY(${bottomTranslateY}px)`,
                  opacity: (revealStage === 'news' || showResults) ? bottomOpacity : 0,
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
                className="border-4 border-[oklch(0.72_0.15_65)] text-[oklch(0.72_0.15_65)] text-2xl font-bold uppercase rounded-lg px-4 py-1 tracking-widest absolute bottom-8 left-1/2 -translate-x-1/2 rotate-0 pointer-events-none z-30 transition-opacity duration-75"
              >
                SKIP
              </div>

              {renderCardContent(card)}
            </div>
          </div>
        </div>
      )}

      {showResults && (
        <div className={`w-[92vw] max-w-[460px] sm:w-[420px] ${topBgColor} rounded-[20px] border border-[oklch(0.28_0.02_250)] p-5 shadow-2xl backdrop-blur-sm transition-all duration-300 sm:p-6 ${showResults ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className={`transition-all duration-300 ${revealStage === 'idle' ? 'opacity-0' : 'opacity-100'}`}>
            <div className="text-center mb-2">
              <div className={`text-5xl font-bold ${percentColor} font-['Inter']`}>{card.approvalPercent}%</div>
              <div className={`text-2xl ${trendColor} flex items-center justify-center`}>
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
