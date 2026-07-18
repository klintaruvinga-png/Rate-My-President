import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  HomeIcon,
  GlobeIcon,
  NoLikeIcon,
  LikeIcon,
  SkipIcon,
  TrendUpIcon,
  TrendDownIcon,
  ShareIcon,
  BadgeIcon,
} from './Icons';
import AnimatedFlag from './AnimatedFlag';
import type { CardData, VoteAction } from './SwipeCard.types';
import { shareToWhatsApp, shareToFacebook, shareToTwitter, copyLinkToClipboard } from './utils/socialShare';
import { useCountdownTimer, formatDuration } from './hooks/useCountdownTimer';

const DEFAULT_SHARE_TEXT = 'Check out today\'s leaderboard on Rate My President!';

interface SwipeCardProps {
  card: CardData;
  nextCard?: CardData;
  /**
   * Callback fired when the user casts a vote.
   * Return false to cancel the vote result, or true/undefined to continue.
   */
  onVote: (action: VoteAction) => boolean | Promise<boolean>;
  isLoading?: boolean;
  showMicroHistory?: boolean;
  headerImageUrl?: string;
  totalRated?: number;
  isLocked?: boolean;
  remainingSwipes?: number;
  nextResetAt?: number;
  onShareLeaderboard?: () => void;
  onShowLeaderboard?: () => void;
  shareUrl?: string;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  card,
  nextCard,
  onVote,
  isLoading = false,
  showMicroHistory = true,
  headerImageUrl,
  totalRated,
  isLocked = false,
  remainingSwipes,
  nextResetAt,
  onShareLeaderboard,
  onShowLeaderboard,
  shareUrl,
}) => {
  const leaderboardUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return shareUrl || '#leaderboard';
    }
    return shareUrl || `${window.location.origin}${window.location.pathname}#leaderboard`;
  }, [shareUrl]);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  }>({ isDragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });

  const [isFlinging, setIsFlinging] = useState(false);
  const [flingAction, setFlingAction] = useState<VoteAction>(null);

  const [voteAction, setVoteAction] = useState<VoteAction>(null);
  const [showResults, setShowResults] = useState(false);
  const [revealStage, setRevealStage] = useState<'idle' | 'number' | 'confirmation' | 'news'>('idle');
  const [hoveredButton, setHoveredButton] = useState<VoteAction>(null);

  const draggableRef = useRef<HTMLDivElement>(null);

  const remainingMs = useCountdownTimer(isLocked ? nextResetAt : undefined);

  const SWIPE_THRESHOLD = 120; // 120px drag threshold

  // Reset state when card changes
  useEffect(() => {
    setVoteAction(null);
    setShowResults(false);
    setRevealStage('idle');
    setDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
    });
    setIsFlinging(false);
    setFlingAction(null);
  }, [card.id]);

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('button, a, input, select, textarea, [role="button"], [data-interactive="true"]'));
  };

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (voteAction || isLoading || isFlinging || isLocked) return;
    if (isInteractiveTarget(e.target)) return;

    const startX = e.clientX;
    const startY = e.clientY;
    
    setDragState({
      isDragging: true,
      startX,
      startY,
      offsetX: 0,
      offsetY: 0,
    });
    
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.isDragging || voteAction || isLoading || isFlinging || isLocked) return;
    
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    setDragState((prev) => ({
      ...prev,
      offsetX: deltaX,
      offsetY: deltaY,
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.isDragging || isLocked) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    const { offsetX, offsetY } = dragState;
    
    // Check horizontal swipe
    if (Math.abs(offsetX) > SWIPE_THRESHOLD && Math.abs(offsetX) > Math.abs(offsetY)) {
      const action = offsetX > 0 ? 'like' : 'nolike';
      triggerFling(action);
    } 
    // Check vertical swipe up (skip)
    else if (offsetY < -SWIPE_THRESHOLD && Math.abs(offsetY) > Math.abs(offsetX)) {
      triggerFling('skip');
    } 
    // Snap back
    else {
      setDragState({
        isDragging: false,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
      });
    }
  };

  const stopCardGesture = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  const triggerFling = useCallback(async (action: 'like' | 'nolike' | 'skip') => {
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

    setDragState((prev) => ({
      ...prev,
      isDragging: false,
      offsetX: targetX,
      offsetY: targetY,
    }));

    setTimeout(async () => {
      let allowed = true;
      try {
        const result = onVote(action);
        if (result instanceof Promise) {
          const resolved = await result;
          allowed = resolved !== false;
        } else {
          allowed = result !== false;
        }
      } catch {
        allowed = false;
      }

      if (!allowed) {
        setDragState({
          isDragging: false,
          startX: 0,
          startY: 0,
          offsetX: 0,
          offsetY: 0,
        });
        setIsFlinging(false);
        setFlingAction(null);
        return;
      }

      setVoteAction(action);
      setShowResults(true);
      setRevealStage('number');
      setTimeout(() => setRevealStage('confirmation'), 150);
      setTimeout(() => setRevealStage('news'), 800);

      setIsFlinging(false);
      setFlingAction(null);
    }, 250);
  }, [onVote]);

  const handleVote = useCallback((action: VoteAction) => {
    if (voteAction || isLoading || isFlinging || isLocked) return;
    if (action) {
      void triggerFling(action);
    }
  }, [isFlinging, isLocked, isLoading, triggerFling, voteAction]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (voteAction || isLoading || isFlinging || isLocked) return;

      switch (e.key) {
        case 'ArrowLeft':
          handleVote('nolike');
          break;
        case 'ArrowRight':
          handleVote('like');
          break;
        case 'ArrowUp':
          handleVote('skip');
          break;
        case 'l':
        case 'L':
          handleVote('like');
          break;
        case 'r':
        case 'R':
          handleVote('nolike');
          break;
        case 's':
        case 'S':
          handleVote('skip');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleVote, isFlinging, isLocked, isLoading, voteAction, triggerFling]);

  if (isLocked) {
    return (
      <div className="flex h-full flex-col items-center justify-center relative overflow-hidden touch-none pt-0 sm:pt-1">
        <div className={`w-[92vw] max-w-[460px] ${card.type === 'home' ? 'bg-[oklch(0.20_0.02_245)]' : 'bg-[oklch(0.20_0.02_250)]'} rounded-[20px] border border-[oklch(0.28_0.02_250)] p-6 shadow-2xl backdrop-blur-sm text-center`}> 
          <div className="mb-4 text-[oklch(0.95_0.02_250)]">
            <div className="text-xs uppercase tracking-[0.24em] text-[oklch(0.75_0.02_250)]">Daily swipe locked</div>
            <h2 className="mt-3 text-2xl font-bold font-['Space_Grotesk']">Come back after the reset</h2>
          </div>
          <div className="space-y-3 text-sm text-[oklch(0.75_0.02_250)]">
            <p>{remainingSwipes !== undefined ? `${remainingSwipes} swipe${remainingSwipes === 1 ? '' : 's'} left today` : 'You have used your daily vote.'}</p>
            {nextResetAt ? (
              <p>Next vote available in {formatDuration(remainingMs)}</p>
            ) : (
              <p>Try again tomorrow.</p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {onShareLeaderboard && (
              <button
                type="button"
                onClick={onShareLeaderboard}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[oklch(0.62_0.18_142)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[oklch(0.62_0.18_142)]/90"
              >
                <ShareIcon className="w-4 h-4" aria-hidden="true" />
                Share leaderboard
              </button>
            )}
            {onShowLeaderboard && (
              <button
                type="button"
                onClick={onShowLeaderboard}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[oklch(0.28_0.02_250)] bg-[oklch(0.15_0.04_250)] px-4 py-3 text-sm font-semibold text-[oklch(0.95_0.02_250)] transition hover:bg-[oklch(0.18_0.03_250)]"
              >
                See leaderboard
              </button>
            )}
          </div>

          {/* Social share buttons */}
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => shareToWhatsApp({
                title: 'Rate My President',
                text: DEFAULT_SHARE_TEXT,
                url: leaderboardUrl
              })}
              className="p-2 rounded-full bg-[oklch(0.25_0.02_250)] hover:bg-[oklch(0.30_0.02_250)] transition"
              aria-label="Share to WhatsApp"
            >
              <svg className="w-5 h-5 text-[oklch(0.95_0.02_250)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => shareToFacebook({
                title: 'Rate My President',
                text: DEFAULT_SHARE_TEXT,
                url: leaderboardUrl
              })}
              className="p-2 rounded-full bg-[oklch(0.25_0.02_250)] hover:bg-[oklch(0.30_0.02_250)] transition"
              aria-label="Share to Facebook"
            >
              <svg className="w-5 h-5 text-[oklch(0.95_0.02_250)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => shareToTwitter({
                title: 'Rate My President',
                text: DEFAULT_SHARE_TEXT,
                url: leaderboardUrl
              })}
              className="p-2 rounded-full bg-[oklch(0.25_0.02_250)] hover:bg-[oklch(0.30_0.02_250)] transition"
              aria-label="Share to Twitter"
            >
              <svg className="w-5 h-5 text-[oklch(0.95_0.02_250)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={async () => {
                const success = await copyLinkToClipboard(leaderboardUrl);
                if (success) {
                  // Could show a toast notification here
                  console.log('Link copied to clipboard');
                }
              }}
              className="p-2 rounded-full bg-[oklch(0.25_0.02_250)] hover:bg-[oklch(0.30_0.02_250)] transition"
              aria-label="Copy link"
            >
              <ShareIcon className="w-5 h-5 text-[oklch(0.95_0.02_250)]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    setDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
    });
  };

  // Interpolate values for stack animation
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

  // Overlay badge opacities
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

  // Background classes based on card type
  const topBgColor = card.type === 'home' ? 'bg-[oklch(0.20_0.02_245)]' : 'bg-[oklch(0.20_0.02_250)]';
  const bottomBgColor = nextCard?.type === 'home' ? 'bg-[oklch(0.20_0.02_245)]' : 'bg-[oklch(0.20_0.02_250)]';

  // Results colors
  const percentColor = card.approvalPercent >= 50 ? 'text-[oklch(0.62_0.18_142)]' : 'text-[oklch(0.55_0.20_25)]';
  const trendColor = card.trend === 'up'
    ? 'text-[oklch(0.62_0.18_142)]'
    : card.trend === 'down'
      ? 'text-[oklch(0.55_0.20_25)]'
      : 'text-[oklch(0.75_0.02_250)]';

  const renderCardContent = (cardData: CardData, isBottom = false) => {
    const headerImage = cardData.headerImageUrl || headerImageUrl || cardData.avatarUrl || './assets/Obama Header No BG.png';
    const fallbackAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="%230f172a"/><circle cx="60" cy="50" r="24" fill="%23e2e8f0"/><path d="M28 104c8-18 24-26 32-26s24 8 32 26" fill="%23e2e8f0"/></svg>';
    
    return (
      <div className="flex flex-col relative overflow-hidden rounded-t-[20px]">
        {/* Full Bleed Header Image */}
        <div className="relative w-full h-[395px] shrink-0 border-b border-[oklch(0.28_0.02_250)]">
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
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent p-6 pt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 font-['Space_Grotesk'] leading-tight drop-shadow-lg">
              {cardData.leaderName}
            </h2>
            {cardData.officeTitle && (
              <p className="text-white/90 text-base md:text-lg font-['Inter'] mb-1 drop-shadow-md">{cardData.officeTitle}</p>
            )}
            {cardData.party && (
              <p className="text-white/80 text-sm md:text-base font-['Inter'] drop-shadow-md">{cardData.party}</p>
            )}
          </div>
        </div>

        {/* Bottom Section - Buttons */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-6 md:py-8 min-h-[120px] sm:min-h-[80px] shrink-0">
          <div className="flex justify-center gap-4 mt-0 sm:mt-0 md:mt-0">
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
              className={`w-11 h-11 md:w-16 md:h-16 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 active:translate-y-[1px] font-['Space_Grotesk'] ${
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
              className={`w-11 h-11 md:w-16 md:h-16 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 active:translate-y-[1px] font-['Space_Grotesk'] ${
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
              className={`w-11 h-11 md:w-16 md:h-16 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 active:translate-y-[1px] font-['Space_Grotesk'] ${
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

  return (
    <div className="flex flex-col items-center justify-center bg-[oklch(0.15_0.04_250)] relative" style={{ paddingTop: 'env(safe-area-inset-top, 4px)', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
      {/* Vote History Pill */}
      {totalRated !== undefined && totalRated > 0 && (
        <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-[oklch(0.20_0.02_250)]/80 backdrop-blur-sm border border-[oklch(0.28_0.02_250)] rounded-full px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-[oklch(0.75_0.02_250)] font-['Inter'] flex items-center gap-2">
          <span>🗳️</span>
          <span>{totalRated} Rated</span>
        </div>
      )}

      {/* Voted card container (exits, fades out) */}
      {!showResults && (
        <div className={`flex flex-col items-center gap-2 w-full flex-grow transition-all duration-150 ${voteAction ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
        {/* Card Z-Stack */}
        <div className="relative max-w-[460px] w-[92vw] sm:w-[85vw] md:w-[75vw] lg:w-[420px] h-full flex-grow mx-auto" style={{ boxSizing: 'border-box' }}>
          {/* Bottom Card (Next Card) */}
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

          {/* Top Card (Active Card) */}
          <div
            ref={draggableRef}
            className={`absolute inset-0 rounded-[20px] cursor-grab select-none overflow-hidden ${topBgColor} border border-[oklch(0.28_0.02_250)] shadow-2xl backdrop-blur-sm ${
              dragState.isDragging ? 'cursor-grabbing' : ''
            } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            style={{
              transform: `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${topRotation}deg) scale(${topScale})`,
              transition: dragState.isDragging
                ? 'none'
                : isFlinging
                  ? 'transform 0.25s ease-out'
                  : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              zIndex: 20,
              touchAction: 'none',
            }}
          >
            {/* Overlay Badges */}
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

            {renderCardContent(card, false)}
          </div>
        </div>
      </div>
      )}

      {/* Results card (fades in from center) */}
      {showResults && (
        <div
          className={`w-[92vw] sm:w-[85vw] md:w-[75vw] lg:w-[420px] max-w-[460px] ${topBgColor} rounded-[20px] p-6 border border-[oklch(0.28_0.02_250)] shadow-2xl backdrop-blur-sm transition-all duration-300 ${
            showResults ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* Approval % (appears first) */}
          <div
            className={`transition-all duration-300 ${revealStage === 'idle' ? 'opacity-0' : 'opacity-100'}`}
          >
            <div className="text-center mb-2">
              <div className={`text-5xl font-bold ${percentColor} font-['Inter']`}>
                {card.approvalPercent}%
              </div>
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

          {/* Confirmation (fades in after number) */}
          {revealStage !== 'idle' && revealStage !== 'number' && (
            <div
              className={`transition-all duration-300 text-center text-lg text-[oklch(0.95_0.02_250)] mb-4 font-['Space_Grotesk'] ${
                revealStage === 'confirmation' || revealStage === 'news' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Your opinion has been counted.
            </div>
          )}

          {/* Micro-history (fades in with news) */}
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

          {/* Headlines (fades in last) */}
          {revealStage === 'news' && (
            <div className="space-y-2">
              {card.headlines.slice(0, 2).map((headline, idx) => (
                <a
                  key={idx}
                  href={headline.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-[oklch(0.75_0.02_250)] hover:text-[oklch(0.95_0.02_250)] transition-colors font-['Space_Grotesk']"
                >
                  <div className="font-medium">{headline.title}</div>
                  <div className="text-xs opacity-60 font-['Inter']">
                    {headline.source} · {headline.date}
                  </div>
                </a>
              ))}
              {card.headlines.length === 0 && (
                <p className="text-sm text-[oklch(0.75_0.02_250)] opacity-60 text-center font-['Space_Grotesk']">
                  No recent qualifying coverage
                </p>
              )}
            </div>
          )}

          {/* Next affordance */}
          {revealStage === 'news' && (
            <p className="text-center text-xs text-[oklch(0.75_0.02_250)] opacity-40 mt-6 font-['Space_Grotesk']">
              Swipe or tap next card to advance
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SwipeCard;
