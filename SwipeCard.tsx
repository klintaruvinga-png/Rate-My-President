import React, { useState, useRef, useEffect } from 'react';

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
  onVote: (action: VoteAction) => void;
  isLoading?: boolean;
  showMicroHistory?: boolean;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  card,
  onVote,
  isLoading = false,
  showMicroHistory = true,
}) => {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    currentX: number;
    currentRotation: number;
  }>({ isDragging: false, startX: 0, currentX: 0, currentRotation: 0 });

  const [voteAction, setVoteAction] = useState<VoteAction>(null);
  const [showResults, setShowResults] = useState(false);
  const [revealStage, setRevealStage] = useState<'idle' | 'number' | 'confirmation' | 'news'>('idle');
  const [hoveredButton, setHoveredButton] = useState<VoteAction>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 0.4; // 40% of card width
  const DRAG_ROTATION_MULTIPLIER = 0.05;

  // Handle mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (voteAction || isLoading) return;
    const startX = e.clientX;
    setDragState((prev) => ({ ...prev, isDragging: true, startX }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || voteAction || isLoading) return;

    const cardWidth = draggableRef.current?.offsetWidth || 0;
    const deltaX = e.clientX - dragState.startX;
    const rotation = deltaX * DRAG_ROTATION_MULTIPLIER;

    setDragState((prev) => ({
      ...prev,
      currentX: deltaX,
      currentRotation: rotation,
    }));
  };

  const handleMouseUp = () => {
    if (!dragState.isDragging) return;

    const cardWidth = draggableRef.current?.offsetWidth || 0;
    const threshold = cardWidth * SWIPE_THRESHOLD;

    if (Math.abs(dragState.currentX) > threshold) {
      const action: VoteAction = dragState.currentX > 0 ? 'approve' : 'disapprove';
      handleVote(action);
    } else {
      // Snap back to center
      setDragState({ isDragging: false, startX: 0, currentX: 0, currentRotation: 0 });
    }
  };

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (voteAction || isLoading) return;
    const startX = e.touches[0].clientX;
    setDragState((prev) => ({ ...prev, isDragging: true, startX }));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragState.isDragging || voteAction || isLoading) return;

    const deltaX = e.touches[0].clientX - dragState.startX;
    const rotation = deltaX * DRAG_ROTATION_MULTIPLIER;

    setDragState((prev) => ({
      ...prev,
      currentX: deltaX,
      currentRotation: rotation,
    }));
  };

  const handleTouchEnd = () => {
    if (!dragState.isDragging) return;

    const cardWidth = draggableRef.current?.offsetWidth || 0;
    const threshold = cardWidth * SWIPE_THRESHOLD;

    if (Math.abs(dragState.currentX) > threshold) {
      const action: VoteAction = dragState.currentX > 0 ? 'approve' : 'disapprove';
      handleVote(action);
    } else {
      setDragState({ isDragging: false, startX: 0, currentX: 0, currentRotation: 0 });
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (voteAction || isLoading) return;

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
  }, [voteAction, isLoading]);

  const handleVote = (action: VoteAction) => {
    if (voteAction || isLoading) return;

    setVoteAction(action);

    // Trigger haptic feedback if available
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // Card exit animation
    setTimeout(() => {
      setShowResults(true);
      // Staggered reveals
      setRevealStage('number');
      setTimeout(() => setRevealStage('confirmation'), 150);
      setTimeout(() => setRevealStage('news'), 300);
    }, 150);

    // Call the callback
    onVote(action);
  };

  // Background color based on card type
  const bgColor = card.type === 'home' ? 'bg-[oklch(0.20_0.02_245)]' : 'bg-[oklch(0.20_0.02_250)]';

  // Approval % color
  const percentColor = card.approvalPercent >= 50 ? 'text-[oklch(0.62_0.18_142)]' : 'text-[oklch(0.55_0.20_25)]';

  // Trend icon
  const trendIcon =
    card.trend === 'up'
      ? '↑'
      : card.trend === 'down'
        ? '↓'
        : '→';

  const trendColor =
    card.trend === 'up'
      ? 'text-[oklch(0.62_0.18_142)]'
      : card.trend === 'down'
        ? 'text-[oklch(0.55_0.20_25)]'
        : 'text-[oklch(0.75_0.02_250)]';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[oklch(0.15_0.04_250)] p-4">
      {/* Voted card container (exits, fades out) */}
      <div
        className={`transition-all duration-150 ${voteAction ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      >
        {/* Draggable card */}
        <div
          ref={draggableRef}
          className={`w-80 ${bgColor} rounded-[12px] p-6 cursor-grab select-none transition-transform ${dragState.isDragging ? 'cursor-grabbing' : ''} ${isLoading ? 'opacity-50' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (dragState.isDragging) handleMouseUp();
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: dragState.isDragging
              ? `translateX(${dragState.currentX}px) rotate(${dragState.currentRotation}deg) scale(${1 - Math.abs(dragState.currentX) / 500})`
              : 'translateX(0) rotate(0) scale(1)',
          }}
        >
          {/* Badge + Country (top-right) */}
          <div className="absolute top-4 right-4 flex items-center gap-2 text-[oklch(0.75_0.02_250)] text-xs font-medium opacity-60">
            <span>{card.type === 'home' ? '🏠' : '🌍'}</span>
            <span>{card.countryFlag}</span>
            <span className="text-xs">{card.countryName}</span>
          </div>

          {/* Avatar */}
          <div className="flex justify-center mb-4 mt-2">
            <img
              src={card.avatarUrl}
              alt={card.leaderName}
              className="w-[120px] h-[120px] rounded-full object-cover border-2 border-[oklch(0.28_0.02_250)]"
            />
          </div>

          {/* Leader name */}
          <h2 className="text-center text-2xl font-semibold text-[oklch(0.95_0.02_250)] mb-6 font-['Space_Grotesk']">
            {card.leaderName}
          </h2>

          {/* Swipe hint (first-time users or first-run) */}
          <p className="text-center text-sm text-[oklch(0.75_0.02_250)] opacity-50 font-['Space_Grotesk']">
            Swipe left or right to vote
          </p>
        </div>

        {/* Button row (always visible on mobile, appear on hover on desktop) */}
        <div className="flex justify-center gap-4 mt-6">
          {/* Disapprove button */}
          <button
            onClick={() => handleVote('disapprove')}
            onMouseEnter={() => setHoveredButton('disapprove')}
            onMouseLeave={() => setHoveredButton(null)}
            disabled={isLoading || voteAction !== null}
            className={`hidden md:block px-6 py-2 rounded-lg font-medium text-sm transition-all duration-100 font-['Space_Grotesk'] ${
              hoveredButton === 'disapprove'
                ? 'bg-[oklch(0.55_0.20_25)] text-white'
                : 'bg-transparent text-[oklch(0.55_0.20_25)] border border-[oklch(0.55_0.20_25)]'
            }`}
            aria-label="Disapprove"
          >
            👎 Disapprove
          </button>

          {/* Mobile disapprove icon */}
          <button
            onClick={() => handleVote('disapprove')}
            disabled={isLoading || voteAction !== null}
            className="md:hidden w-12 h-12 flex items-center justify-center rounded-lg bg-[oklch(0.28_0.02_250)] text-lg opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Disapprove"
          >
            👎
          </button>

          {/* Approve button */}
          <button
            onClick={() => handleVote('approve')}
            onMouseEnter={() => setHoveredButton('approve')}
            onMouseLeave={() => setHoveredButton(null)}
            disabled={isLoading || voteAction !== null}
            className={`hidden md:block px-6 py-2 rounded-lg font-medium text-sm transition-all duration-100 font-['Space_Grotesk'] ${
              hoveredButton === 'approve'
                ? 'bg-[oklch(0.62_0.18_142)] text-white'
                : 'bg-transparent text-[oklch(0.62_0.18_142)] border border-[oklch(0.62_0.18_142)]'
            }`}
            aria-label="Approve"
          >
            👍 Approve
          </button>

          {/* Mobile approve icon */}
          <button
            onClick={() => handleVote('approve')}
            disabled={isLoading || voteAction !== null}
            className="md:hidden w-12 h-12 flex items-center justify-center rounded-lg bg-[oklch(0.28_0.02_250)] text-lg opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Approve"
          >
            👍
          </button>

          {/* Skip button (muted) */}
          <button
            onClick={() => handleVote('skip')}
            onMouseEnter={() => setHoveredButton('skip')}
            onMouseLeave={() => setHoveredButton(null)}
            disabled={isLoading || voteAction !== null}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all duration-100 font-['Space_Grotesk'] ${
              hoveredButton === 'skip'
                ? 'bg-[oklch(0.28_0.02_250)] text-[oklch(0.75_0.02_250)]'
                : 'bg-transparent text-[oklch(0.75_0.02_250)] opacity-50'
            }`}
            aria-label="Skip"
          >
            ⊘ Skip
          </button>
        </div>
      </div>

      {/* Results card (fades in from center) */}
      {showResults && (
        <div
          className={`w-80 ${bgColor} rounded-[12px] p-6 transition-all duration-300 ${showResults ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
          {/* Approval % (appears first) */}
          <div
            className={`transition-all duration-300 ${revealStage === 'idle' ? 'opacity-0' : 'opacity-100'}`}
          >
            <div className="text-center mb-2">
              <div className={`text-5xl font-bold ${percentColor}`}>
                {card.approvalPercent}%
              </div>
              <div className={`text-2xl ${trendColor}`}>{trendIcon}</div>
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
              {card.yesterdayVote === 'approve' ? '👍' : card.yesterdayVote === 'disapprove' ? '👎' : '⊘'}{' '}
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
            <p className="text-center text-sm text-[oklch(0.75_0.02_250)] opacity-60 mt-4 font-['Space_Grotesk']">
              Swipe or tap for the next leader
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SwipeCard;
