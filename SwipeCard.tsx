import React, { useState, useRef, useEffect } from 'react';
import {
  HomeIcon,
  GlobeIcon,
  DisapproveIcon,
  ApproveIcon,
  SkipIcon,
  TrendUpIcon,
  TrendDownIcon,
  BadgeIcon,
} from './Icons';

type CardType = 'home' | 'global';
type VoteAction = 'approve' | 'disapprove' | 'skip' | null;

interface CardData {
  id: string;
  type: CardType;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  leaderName: string;
  avatarUrl: string;
  approvalPercent: number;
  trend: 'up' | 'down' | 'neutral';
  headlines: Array<{ title: string; source: string; date: string; url: string }>;
  yesterdayVote?: 'approve' | 'disapprove' | 'skip';
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
  nextCard,
  onVote,
  isLoading = false,
  showMicroHistory = true,
}) => {
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

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (voteAction || isLoading || isFlinging) return;
    
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
    if (!dragState.isDragging || voteAction || isLoading || isFlinging) return;
    
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    setDragState((prev) => ({
      ...prev,
      offsetX: deltaX,
      offsetY: deltaY,
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.isDragging) return;
    
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    
    const { offsetX, offsetY } = dragState;
    
    // Check horizontal swipe
    if (Math.abs(offsetX) > SWIPE_THRESHOLD && Math.abs(offsetX) > Math.abs(offsetY)) {
      const action = offsetX > 0 ? 'approve' : 'disapprove';
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

  const triggerFling = (action: 'approve' | 'disapprove' | 'skip') => {
    setIsFlinging(true);
    setFlingAction(action);
    
    let targetX = 0;
    let targetY = 0;
    if (action === 'approve') {
      targetX = 600;
    } else if (action === 'disapprove') {
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

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (voteAction || isLoading || isFlinging) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleVote('approve');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleVote('disapprove');
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
  let approveOpacity = 0;
  let disapproveOpacity = 0;
  let skipOpacity = 0;

  if (isFlinging) {
    if (flingAction === 'approve') approveOpacity = 1;
    if (flingAction === 'disapprove') disapproveOpacity = 1;
    if (flingAction === 'skip') skipOpacity = 1;
  } else if (dragState.isDragging) {
    if (offsetX > 0 && offsetX > Math.abs(offsetY)) {
      approveOpacity = Math.min(offsetX / 80, 1);
    } else if (offsetX < 0 && Math.abs(offsetX) > Math.abs(offsetY)) {
      disapproveOpacity = Math.min(Math.abs(offsetX) / 80, 1);
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
    return (
      <div className="h-full flex flex-col justify-between relative">
        {/* Badge + Country (top-right) */}
        <div className="absolute top-0 right-0 flex items-center gap-2 text-[oklch(0.75_0.02_250)] text-xs font-medium opacity-60">
          <div className="w-4 h-4 text-[oklch(0.75_0.02_250)]">
            {cardData.type === 'home' ? (
              <HomeIcon aria-label="Home" />
            ) : (
              <GlobeIcon aria-label="Global" />
            )}
          </div>
          <span>{cardData.countryFlag}</span>
          <span className="text-xs">{cardData.countryName}</span>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-4 mt-6">
          <img
            src={cardData.avatarUrl}
            alt={cardData.leaderName}
            className="w-[120px] h-[120px] rounded-avatar-hero object-cover border-2 border-[oklch(0.28_0.02_250)]"
          />
        </div>

        {/* Leader name */}
        <h2 className="text-center text-2xl font-semibold text-[oklch(0.95_0.02_250)] mb-4 font-['Space_Grotesk'] leading-tight">
          {cardData.leaderName}
        </h2>

        {/* Swipe hint */}
        <p className="text-center text-sm text-[oklch(0.75_0.02_250)] opacity-50 font-['Space_Grotesk']">
          {isBottom ? 'Up next...' : 'Swipe left or right to vote'}
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[oklch(0.15_0.04_250)] p-4">
      {/* Voted card container (exits, fades out) */}
      <div
        className={`transition-all duration-150 ${voteAction ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      >
        {/* Card Z-Stack */}
        <div className="relative w-80 h-[320px] mb-6">
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
            className={`absolute inset-0 rounded-[12px] p-6 cursor-grab select-none ${topBgColor} border border-[oklch(0.28_0.02_250)] shadow-2xl ${
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
              style={{ opacity: approveOpacity }}
              className="border-4 border-[oklch(0.62_0.18_142)] text-[oklch(0.62_0.18_142)] text-2xl font-bold uppercase rounded-lg px-3 py-1 tracking-widest absolute top-8 left-6 rotate-[-12deg] pointer-events-none z-30 transition-opacity duration-75"
            >
              APPROVE
            </div>
            <div
              style={{ opacity: disapproveOpacity }}
              className="border-4 border-[oklch(0.55_0.20_25)] text-[oklch(0.55_0.20_25)] text-2xl font-bold uppercase rounded-lg px-3 py-1 tracking-widest absolute top-8 right-6 rotate-[12deg] pointer-events-none z-30 transition-opacity duration-75"
            >
              OPPOSE
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

        {/* Button row (always visible on mobile, appear on hover on desktop) */}
        <div className="flex justify-center gap-4 mt-6">
          {/* Disapprove button */}
          <button
            onClick={() => handleVote('disapprove')}
            onMouseEnter={() => setHoveredButton('disapprove')}
            onMouseLeave={() => setHoveredButton(null)}
            disabled={isLoading || voteAction !== null || isFlinging}
            className={`hidden md:flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-all duration-100 font-['Space_Grotesk'] ${
              hoveredButton === 'disapprove'
                ? 'bg-[oklch(0.55_0.20_25)] text-white'
                : 'bg-transparent text-[oklch(0.55_0.20_25)] border border-[oklch(0.55_0.20_25)]'
            }`}
            aria-label="Disapprove"
          >
            <span aria-hidden="true" className="inline-flex">
              <DisapproveIcon className="w-4 h-4" />
            </span>
            Disapprove
          </button>

          {/* Mobile disapprove icon */}
          <button
            onClick={() => handleVote('disapprove')}
            disabled={isLoading || voteAction !== null || isFlinging}
            className="md:hidden w-12 h-12 flex items-center justify-center rounded-lg bg-[oklch(0.28_0.02_250)] text-[oklch(0.55_0.20_25)] opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Disapprove"
          >
            <span aria-hidden="true" className="inline-flex">
              <DisapproveIcon className="w-6 h-6" />
            </span>
          </button>

          {/* Approve button */}
          <button
            onClick={() => handleVote('approve')}
            onMouseEnter={() => setHoveredButton('approve')}
            onMouseLeave={() => setHoveredButton(null)}
            disabled={isLoading || voteAction !== null || isFlinging}
            className={`hidden md:flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-all duration-100 font-['Space_Grotesk'] ${
              hoveredButton === 'approve'
                ? 'bg-[oklch(0.62_0.18_142)] text-white'
                : 'bg-transparent text-[oklch(0.62_0.18_142)] border border-[oklch(0.62_0.18_142)]'
            }`}
            aria-label="Approve"
          >
            <span aria-hidden="true" className="inline-flex">
              <ApproveIcon className="w-4 h-4" />
            </span>
            Approve
          </button>

          {/* Mobile approve icon */}
          <button
            onClick={() => handleVote('approve')}
            disabled={isLoading || voteAction !== null || isFlinging}
            className="md:hidden w-12 h-12 flex items-center justify-center rounded-lg bg-[oklch(0.28_0.02_250)] text-[oklch(0.62_0.18_142)] opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Approve"
          >
            <span aria-hidden="true" className="inline-flex">
              <ApproveIcon className="w-6 h-6" />
            </span>
          </button>

          {/* Skip button (muted) */}
          <button
            onClick={() => handleVote('skip')}
            onMouseEnter={() => setHoveredButton('skip')}
            onMouseLeave={() => setHoveredButton(null)}
            disabled={isLoading || voteAction !== null || isFlinging}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-all duration-100 font-['Space_Grotesk'] ${
              hoveredButton === 'skip'
                ? 'bg-[oklch(0.28_0.02_250)] text-[oklch(0.75_0.02_250)]'
                : 'bg-transparent text-[oklch(0.75_0.02_250)] opacity-50'
            }`}
            aria-label="Skip"
          >
            <span aria-hidden="true" className="inline-flex">
              <SkipIcon className="w-4 h-4" />
            </span>
            Skip
          </button>
        </div>
      </div>

      {/* Results card (fades in from center) */}
      {showResults && (
        <div
          className={`w-80 ${topBgColor} rounded-[12px] p-6 border border-[oklch(0.28_0.02_250)] shadow-2xl transition-all duration-300 ${
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
                {card.yesterdayVote === 'approve' ? (
                  <span aria-hidden="true" className="inline-flex">
                    <ApproveIcon />
                  </span>
                ) : card.yesterdayVote === 'disapprove' ? (
                  <span aria-hidden="true" className="inline-flex">
                    <DisapproveIcon />
                  </span>
                ) : (
                  <span aria-hidden="true" className="inline-flex">
                    <SkipIcon />
                  </span>
                )}
              </span>{' '}
              {card.yesterdayVote === 'approve' ? 'Approve' : card.yesterdayVote === 'disapprove' ? 'Disapprove' : 'Skip'}
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
