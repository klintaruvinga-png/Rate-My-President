import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { LeaderboardEntry, LeaderboardProps, LeaderboardSortState } from './Leaderboard.types';
import { TrendUpIcon, TrendDownIcon, ChevronDownIcon, ShareIcon } from './Icons';
import AnimatedFlag from './AnimatedFlag';

export default function Leaderboard({
  entries,
  isLoading = false,
  error = null,
  selectedWindow = 'day',
  onWindowChange,
  onLeaderClick,
  lastUpdated,
}: LeaderboardProps) {
  const [sortState, setSortState] = useState<LeaderboardSortState>({
    column: 'rank',
    direction: 'asc',
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const timeDropdownRef = useRef<HTMLDivElement>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  // Read ?window= query param on mount for deep linking
  const onWindowChangeRef = useRef(onWindowChange);
  useEffect(() => {
    onWindowChangeRef.current = onWindowChange;
  }, [onWindowChange]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const windowParam = params.get('window');
    if (windowParam && ['day', 'week', 'all'].includes(windowParam)) {
      onWindowChangeRef.current?.(windowParam as 'day' | 'week' | 'all');
    }
  }, []);

  // Slow stream-style auto-scroll with 300ms initial pause
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !entries || entries.length === 0) return;

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let scrollInterval: ReturnType<typeof setInterval> | null = null;
    let scrollTimeout: ReturnType<typeof setTimeout>;
    let isPaused = false;
    let initialDelayElapsed = false;

    const startScroll = () => {
      // Clear any existing interval
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }

      // Only start scrolling if content overflows container
      if (container.scrollHeight <= container.clientHeight) return;

      scrollInterval = setInterval(() => {
        if (!isPaused) {
          if (container.scrollTop + container.clientHeight >= container.scrollHeight - 10) {
            // Reset to top when reaching bottom
            container.scrollTop = 0;
          } else {
            container.scrollTop += 1;
          }
        }
      }, 50); // Slow scroll speed
    };

    const stopScroll = () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
    };

    const handleMouseEnter = () => {
      isPaused = true;
    };

    const handleMouseLeave = () => {
      isPaused = false;
    };

    const handleTouchStart = () => {
      isPaused = true;
    };

    const handleTouchEnd = () => {
      isPaused = false;
    };

    const handleTouchCancel = () => {
      isPaused = false;
    };

    // Use ResizeObserver to detect when content overflows
    const resizeObserver = new ResizeObserver(() => {
      if (container.scrollHeight > container.clientHeight) {
        if (!scrollInterval && initialDelayElapsed) {
          startScroll();
        }
      } else {
        stopScroll();
      }
    });

    resizeObserver.observe(container);

    // Initial 300ms pause before starting scroll
    scrollTimeout = setTimeout(() => {
      initialDelayElapsed = true;
      startScroll();
    }, 300);

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      clearTimeout(scrollTimeout);
      stopScroll();
      resizeObserver.disconnect();
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [entries]);

  useEffect(() => {
    setSortState({ column: 'rank', direction: 'asc' });
  }, [selectedWindow]);

  useEffect(() => {
    if (!timeDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) {
        setTimeDropdownOpen(false);
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTimeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [timeDropdownOpen]);

  // Sort entries based on current sort state
  const sortedEntries = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    const sorted = [...entries].sort((a, b) => {
      let compareValue = 0;

      switch (sortState.column) {
        case 'rank':
          compareValue = a.rank - b.rank;
          break;
        case 'approval':
          compareValue = a.approvalPercent - b.approvalPercent;
          break;
        case 'votes':
          compareValue = a.voteCount - b.voteCount;
          break;
        default:
          compareValue = 0;
      }

      return sortState.direction === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [entries, sortState]);

  const handleColumnClick = useCallback(
    (column: 'rank' | 'approval' | 'votes') => {
      setSortState((prev) => ({
        column,
        direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc',
      }));
    },
    []
  );

  const handleWindowChange = useCallback(
    (timeWindow: 'day' | 'week' | 'all') => {
      if (onWindowChange) {
        onWindowChange(timeWindow);
      }
    },
    [onWindowChange]
  );

  const getSortIndicator = (column: LeaderboardSortState['column']) => {
    const isActive = sortState.column === column;
    const direction = isActive ? (sortState.direction === 'desc' ? '▼' : '▲') : '▲';
    return { direction, isActive };
  };

  const getShareUrl = () => {
    if (typeof window === 'undefined') {
      return `/leaderboard?window=${selectedWindow}`;
    }
    return `${window.location.origin}${window.location.pathname}?window=${selectedWindow}`;
  };

  const handleShare = async () => {
    const url = getShareUrl();
    const title = 'Rate My President leaderboard';
    const text = `Check today’s leaderboard for ${selectedWindow === 'day' ? 'today' : selectedWindow === 'week' ? 'this week' : 'all time'}.`;

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as ShareNavigator).share({ title, text, url });
        setShareMessage('Share sheet opened.');
        return;
      } catch (error) {
        // Continue to clipboard fallback.
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setShareMessage('Leaderboard link copied to clipboard.');
        return;
      } catch {
        // ignore and fall through
      }
    }

    setShareMessage('Copy this link to share: ' + url);
  };

  const timeOptions = ['day', 'week', 'all'] as const;
  const timeLabels = { day: 'Today', week: 'This Week', all: 'All-Time' };

  const resolveAvatarSrc = (avatarUrl: string) => {
    if (!avatarUrl) return '';
    if (avatarUrl.startsWith('/avatars/thumbs/')) {
      return avatarUrl;
    }
    if (avatarUrl.startsWith('/avatars/')) {
      return avatarUrl.replace('/avatars/', '/avatars/thumbs/');
    }
    return avatarUrl;
  };

  // Skeleton loader component
  const SkeletonRow = () => (
    <tr className="border-b border-[oklch(0.28_0.02_250)] motion-safe:animate-pulse">
      <td className="px-2 py-2 sm:px-3 sm:py-3 text-[oklch(0.75_0.02_250)]">
        <div className="h-3 w-5 sm:h-4 sm:w-6 bg-[oklch(0.28_0.02_250)] rounded" />
      </td>
      <td className="px-2 py-2 sm:px-3 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-[oklch(0.28_0.02_250)] rounded-avatar-list" />
          <div className="h-3 w-16 sm:h-4 sm:w-24 bg-[oklch(0.28_0.02_250)] rounded" />
        </div>
      </td>
      <td className="px-2 py-2 sm:px-3 sm:py-3 text-right">
        <div className="h-3 w-10 sm:h-4 sm:w-12 bg-[oklch(0.28_0.02_250)] rounded ml-auto" />
      </td>
      <td className="hidden px-2 py-2 sm:px-3 sm:py-3 text-right md:table-cell">
        <div className="h-3 w-6 sm:h-4 sm:w-8 bg-[oklch(0.28_0.02_250)] rounded ml-auto" />
      </td>
      <td className="hidden px-2 py-2 sm:px-3 sm:py-3 text-right lg:table-cell">
        <div className="h-3 w-12 sm:h-4 sm:w-16 bg-[oklch(0.28_0.02_250)] rounded ml-auto" />
      </td>
    </tr>
  );

  return (
    <div className="w-full bg-[oklch(0.15_0.04_250)] text-[oklch(0.95_0.02_250)]">
      {/* Filter Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[oklch(0.28_0.02_250)] bg-[oklch(0.18_0.03_250)] px-4 py-2 sm:px-6 sm:py-3">
        {/* Time Selection Dropdown */}
        <div className="relative" ref={timeDropdownRef}>
          <button
            onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
            aria-expanded={timeDropdownOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-['Space_Grotesk'] transition-all bg-[oklch(0.20_0.02_250)] text-[oklch(0.95_0.02_250)] hover:bg-[oklch(0.28_0.02_250)]"
          >
            {timeLabels[selectedWindow]}
            <ChevronDownIcon className="w-4 h-4" aria-hidden="true" />
          </button>
          {timeDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 z-20 bg-[oklch(0.20_0.02_250)] rounded-lg border border-[oklch(0.28_0.02_250)] shadow-lg min-w-[150px]">
              {timeOptions.map((timeWindow) => (
                <button
                  key={timeWindow}
                  onClick={() => {
                    handleWindowChange(timeWindow);
                    setTimeDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-['Space_Grotesk'] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    selectedWindow === timeWindow
                      ? 'bg-[oklch(0.62_0.18_142)] text-white'
                      : 'text-[oklch(0.75_0.02_250)] hover:bg-[oklch(0.28_0.02_250)] hover:text-[oklch(0.95_0.02_250)]'
                  }`}
                >
                  {timeLabels[timeWindow]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-6 text-center">
          <p className="text-[oklch(0.55_0.20_25)] font-['Space_Grotesk']">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-[oklch(0.62_0.18_142)] text-[oklch(0.15_0.04_250)] rounded-lg font-['Space_Grotesk'] font-600 hover:opacity-90 transition-opacity"
          >
            Try Refreshing
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && entries.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-[oklch(0.75_0.02_250)] font-['Space_Grotesk'] text-lg">
            No rankings yet.
          </p>
          <p className="text-[oklch(0.75_0.02_250)] font-['Space_Grotesk'] text-sm mt-2">
            Check back after voting opens tomorrow.
          </p>
        </div>
      )}

      {/* Table */}
      {!error && entries.length > 0 && (
        <div className="max-h-[min(64vh,560px)] overflow-auto" ref={scrollContainerRef}>
          <table
            className="w-full text-sm min-w-[320px]"
            role="grid"
            aria-label={`Leader rankings for ${selectedWindow === 'day' ? 'today' : selectedWindow === 'week' ? 'this week' : 'all time'}`}
          >
            <thead className="sticky top-0 z-10 border-b border-[oklch(0.28_0.02_250)] bg-[oklch(0.20_0.02_250)]">
              <tr>
                <th
                  className={`px-2 py-2 text-left font-['Inter'] font-600 cursor-pointer transition-colors sm:px-3 sm:py-3 ${getSortIndicator('rank').isActive ? 'text-[oklch(0.95_0.02_250)]' : 'text-[oklch(0.75_0.02_250)] hover:text-[oklch(0.95_0.02_250)]'}`}
                  onClick={() => handleColumnClick('rank')}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleColumnClick('rank');
                    }
                  }}
                  tabIndex={0}
                  aria-sort={sortState.column === 'rank' ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center gap-1">
                    Rank
                    <span className={`text-xs min-w-4 ${getSortIndicator('rank').isActive ? 'opacity-100' : 'opacity-40'}`}>{getSortIndicator('rank').direction}</span>
                  </div>
                </th>
                <th className="px-2 py-2 text-left font-['Inter'] font-600 text-[oklch(0.75_0.02_250)] sm:px-3 sm:py-3">
                  Leader
                </th>
                <th
                  className={`px-2 py-2 text-center font-['Inter'] font-600 cursor-pointer transition-colors sm:px-3 sm:py-3 ${getSortIndicator('approval').isActive ? 'text-[oklch(0.95_0.02_250)]' : 'text-[oklch(0.75_0.02_250)] hover:text-[oklch(0.95_0.02_250)]'}`}
                  onClick={() => handleColumnClick('approval')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleColumnClick('approval');
                    }
                  }}
                  tabIndex={0}
                  aria-sort={sortState.column === 'approval' ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center justify-center gap-1">
                    Approval
                    <span className={`text-xs min-w-4 ${getSortIndicator('approval').isActive ? 'opacity-100' : 'opacity-40'}`}>{getSortIndicator('approval').direction}</span>
                  </div>
                </th>
                <th className="hidden px-2 py-2 text-center font-['Inter'] font-600 text-[oklch(0.75_0.02_250)] sm:px-3 sm:py-3 md:table-cell">
                  Trend
                </th>
                <th
                  className={`hidden px-2 py-2 text-center font-['Inter'] font-600 cursor-pointer transition-colors sm:px-3 sm:py-3 lg:table-cell ${getSortIndicator('votes').isActive ? 'text-[oklch(0.95_0.02_250)]' : 'text-[oklch(0.75_0.02_250)] hover:text-[oklch(0.95_0.02_250)]'}`}
                  onClick={() => handleColumnClick('votes')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleColumnClick('votes');
                    }
                  }}
                  tabIndex={0}
                  aria-sort={sortState.column === 'votes' ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center justify-center gap-1">
                    Votes
                    <span className={`text-xs min-w-4 ${getSortIndicator('votes').isActive ? 'opacity-100' : 'opacity-40'}`}>{getSortIndicator('votes').direction}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                : sortedEntries.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className="border-b border-[oklch(0.28_0.02_250)] hover:bg-[oklch(0.20_0.02_250)] transition-colors group motion-safe:animate-[fadeIn_0.2s_ease-out] [animation-fill-mode:backwards]"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-2 py-2 sm:px-3 sm:py-3 text-[oklch(0.75_0.02_250)] font-['Inter'] font-600 w-12">
                        #{entry.rank}
                      </td>
                      <td
                        className={`px-2 py-2 sm:px-3 sm:py-3 ${onLeaderClick ? 'cursor-pointer' : ''}`}
                        role={onLeaderClick ? 'button' : undefined}
                        tabIndex={onLeaderClick ? 0 : undefined}
                        onClick={() => onLeaderClick && onLeaderClick(entry.id)}
                        onKeyDown={(event) => {
                          if ((event.key === 'Enter' || event.key === ' ') && onLeaderClick) {
                            event.preventDefault();
                            onLeaderClick(entry.id);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Avatar */}
                          <img
                            src={resolveAvatarSrc(entry.avatarUrl)}
                            alt={entry.name}
                            loading="lazy"
                            onError={(event) => {
                              const target = event.currentTarget as HTMLImageElement;
                              const originalUrl = entry.avatarUrl;
                              // Fallback chain: thumb → original → SVG placeholder
                              if (target.src.includes('/avatars/thumbs/') && !target.src.endsWith(originalUrl)) {
                                // Try the original URL if we're currently on a thumb
                                target.src = originalUrl;
                              } else if (!target.src.startsWith('data:')) {
                                // If we're already on the original or it failed, use SVG fallback
                                target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="8" fill="%230f172a"/><circle cx="60" cy="50" r="24" fill="%23e2e8f0"/><path d="M28 104c8-18 24-26 32-26s24 8 32 26" fill="%23e2e8f0"/></svg>';
                              }
                            }}
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-avatar-list bg-[oklch(0.20_0.02_250)] flex-shrink-0 object-cover"
                          />
                          {/* Flag + Name */}
                          {(entry.countryCode || entry.countryFlag) && (
                            <AnimatedFlag
                              countryCode={entry.countryCode}
                              fallbackFlag={entry.countryFlag}
                              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                            />
                          )}
                          <span className="font-['Space_Grotesk'] font-600 text-xs sm:text-sm hover:text-[oklch(0.62_0.18_142)] transition-colors truncate">
                            {entry.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 sm:px-3 sm:py-3 text-center font-['Inter'] font-700 text-sm sm:text-base">
                        <span
                          className={entry.approvalPercent >= 50 ? 'text-[oklch(0.62_0.18_142)]' : 'text-[oklch(0.55_0.20_25)]'}
                        >
                          {entry.approvalPercent}%
                        </span>
                      </td>
                      <td className="hidden px-2 py-2 sm:px-3 sm:py-3 text-center md:table-cell">
                        <div className="flex items-center justify-center">
                          {entry.trend === 'up' ? (
                            <TrendUpIcon
                              className={`w-4 h-4 sm:w-5 sm:h-5 text-[oklch(0.62_0.18_142)]`}
                              aria-label="Trend up"
                            />
                          ) : (
                            <TrendDownIcon
                              className={`w-4 h-4 sm:w-5 sm:h-5 text-[oklch(0.55_0.20_25)]`}
                              aria-label="Trend down"
                            />
                          )}
                        </div>
                      </td>
                      <td className="hidden px-2 py-2 sm:px-3 sm:py-3 text-center font-['Inter'] text-[oklch(0.75_0.02_250)] lg:table-cell">
                        {entry.voteCount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer: Last Updated */}
      {!isLoading && !error && entries.length > 0 && (
        <div className="border-t border-[oklch(0.28_0.02_250)] px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[oklch(0.62_0.18_142)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[oklch(0.62_0.18_142)]/90"
            >
              <ShareIcon className="w-4 h-4" aria-hidden="true" />
              Share leaderboard
            </button>
            {shareMessage && (
              <p className="text-xs text-[oklch(0.75_0.02_250)]">{shareMessage}</p>
            )}
          </div>
        </div>
      )}
      {!isLoading && lastUpdated && (
        <div className="px-4 py-2 sm:px-6 sm:py-3 border-t border-[oklch(0.28_0.02_250)] text-xs font-['Inter'] text-[oklch(0.75_0.02_250)]">
          Updated: {lastUpdated}
        </div>
      )}
    </div>
  );
}
