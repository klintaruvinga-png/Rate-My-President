import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { LeaderboardEntry, LeaderboardProps, LeaderboardSortState } from './Leaderboard.types';
import { TrendUpIcon, TrendDownIcon } from './Icons';
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

  // Slow stream-style auto-scroll with 300ms initial pause
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !entries || entries.length === 0) return;

    let scrollInterval: ReturnType<typeof setInterval>;
    let scrollTimeout: ReturnType<typeof setTimeout>;
    let isPaused = false;

    const startScroll = () => {
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

    // Initial 300ms pause before starting scroll
    scrollTimeout = setTimeout(() => {
      startScroll();
    }, 300);

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      clearTimeout(scrollTimeout);
      clearInterval(scrollInterval);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [entries]);

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
    (window: 'day' | 'week' | 'all') => {
      if (onWindowChange) {
        onWindowChange(window);
      }
    },
    [onWindowChange]
  );

  const getSortIndicator = (column: LeaderboardSortState['column']) => {
    const isActive = sortState.column === column;
    const direction = isActive ? (sortState.direction === 'desc' ? '▼' : '▲') : '▲';
    return { direction, isActive };
  };

  const resolveAvatarSrc = (avatarUrl: string) => {
    if (!avatarUrl) return '';
    if (avatarUrl.startsWith('/avatars/')) {
      return avatarUrl.replace('/avatars/', '/avatars/thumbs/');
    }
    return avatarUrl;
  };

  // Skeleton loader component
  const SkeletonRow = () => (
    <tr className="border-b border-[oklch(0.28_0.02_250)] animate-pulse">
      <td className="px-4 py-4 text-[oklch(0.75_0.02_250)]">
        <div className="h-4 w-6 bg-[oklch(0.28_0.02_250)] rounded" />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[oklch(0.28_0.02_250)] rounded-avatar-list" />
          <div className="h-4 w-24 bg-[oklch(0.28_0.02_250)] rounded" />
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <div className="h-4 w-12 bg-[oklch(0.28_0.02_250)] rounded ml-auto" />
      </td>
      <td className="hidden px-4 py-4 text-right md:table-cell">
        <div className="h-4 w-8 bg-[oklch(0.28_0.02_250)] rounded ml-auto" />
      </td>
      <td className="hidden px-4 py-4 text-right lg:table-cell">
        <div className="h-4 w-16 bg-[oklch(0.28_0.02_250)] rounded ml-auto" />
      </td>
    </tr>
  );

  return (
    <div className="w-full bg-[oklch(0.15_0.04_250)] text-[oklch(0.95_0.02_250)]">
      {/* Tabs */}
      <div className="flex gap-1 px-4 sm:px-6">
        {(['day', 'week', 'all'] as const).map((window) => (
          <button
            key={window}
            onClick={() => handleWindowChange(window)}
            aria-selected={selectedWindow === window}
            className={`px-4 py-3 font-['Space_Grotesk'] font-600 text-sm transition-all border-b-2 ${
              selectedWindow === window
                ? 'border-[oklch(0.62_0.18_142)] text-[oklch(0.95_0.02_250)]'
                : 'border-transparent text-[oklch(0.75_0.02_250)] hover:text-[oklch(0.95_0.02_250)]'
            }`}
          >
            {window === 'day' ? 'Today' : window === 'week' ? 'This Week' : 'All-Time'}
          </button>
        ))}
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
            className="w-full text-sm min-w-[500px]"
            role="grid"
            aria-label={`Leader rankings for ${selectedWindow === 'day' ? 'today' : selectedWindow === 'week' ? 'this week' : 'all time'}`}
          >
            <thead className="sticky top-0 z-10 border-b border-[oklch(0.28_0.02_250)] bg-[oklch(0.20_0.02_250)]">
              <tr>
                <th
                  className={`px-4 py-3 text-left font-['Inter'] font-600 cursor-pointer transition-colors ${getSortIndicator('rank').isActive ? 'text-[oklch(0.95_0.02_250)]' : 'text-[oklch(0.75_0.02_250)] hover:text-[oklch(0.95_0.02_250)]'}`}
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
                <th className="px-4 py-3 text-left font-['Inter'] font-600 text-[oklch(0.75_0.02_250)]">
                  Leader
                </th>
                <th
                  className={`px-4 py-3 text-center font-['Inter'] font-600 cursor-pointer transition-colors ${getSortIndicator('approval').isActive ? 'text-[oklch(0.95_0.02_250)]' : 'text-[oklch(0.75_0.02_250)] hover:text-[oklch(0.95_0.02_250)]'}`}
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
                <th className="hidden px-4 py-3 text-center font-['Inter'] font-600 text-[oklch(0.75_0.02_250)] md:table-cell">
                  Trend
                </th>
                <th
                  className={`hidden px-4 py-3 text-center font-['Inter'] font-600 cursor-pointer transition-colors lg:table-cell ${getSortIndicator('votes').isActive ? 'text-[oklch(0.95_0.02_250)]' : 'text-[oklch(0.75_0.02_250)] hover:text-[oklch(0.95_0.02_250)]'}`}
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
                      className="border-b border-[oklch(0.28_0.02_250)] hover:bg-[oklch(0.20_0.02_250)] transition-colors group animate-[fadeIn_0.2s_ease-out]"
                      style={{ animationDelay: `${index * 20}ms` }}
                    >
                      <td className="px-4 py-4 text-[oklch(0.75_0.02_250)] font-['Inter'] font-600 w-12">
                        #{entry.rank}
                      </td>
                      <td
                        className="px-4 py-4 cursor-pointer"
                        onClick={() => onLeaderClick && onLeaderClick(entry.id)}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <img
                            src={resolveAvatarSrc(entry.avatarUrl)}
                            alt={entry.name}
                            loading="lazy"
                            onError={(event) => {
                              const target = event.currentTarget as HTMLImageElement;
                              if (target.src.includes('/avatars/thumbs/')) {
                                target.src = entry.avatarUrl;
                              } else if (!target.src.startsWith('data:')) {
                                target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="%230f172a"/><circle cx="60" cy="50" r="24" fill="%23e2e8f0"/><path d="M28 104c8-18 24-26 32-26s24 8 32 26" fill="%23e2e8f0"/></svg>';
                              }
                            }}
                            className="h-10 w-10 rounded-avatar-list bg-[oklch(0.20_0.02_250)] flex-shrink-0 object-cover"
                          />
                          {/* Flag + Name */}
                          {(entry.countryCode || entry.countryFlag) && (
                            <AnimatedFlag
                              countryCode={entry.countryCode}
                              fallbackFlag={entry.countryFlag}
                              className="w-5 h-5 flex-shrink-0"
                            />
                          )}
                          <span className="font-['Space_Grotesk'] font-600 text-sm hover:text-[oklch(0.62_0.18_142)] transition-colors truncate">
                            {entry.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-['Inter'] font-700 text-base">
                        <span
                          className={entry.approvalPercent >= 50 ? 'text-[oklch(0.62_0.18_142)]' : 'text-[oklch(0.55_0.20_25)]'}
                        >
                          {entry.approvalPercent}%
                        </span>
                      </td>
                      <td className="hidden px-4 py-4 text-center md:table-cell">
                        <div className="flex items-center justify-center">
                          {entry.trend === 'up' ? (
                            <TrendUpIcon
                              className={`w-5 h-5 text-[oklch(0.62_0.18_142)]`}
                              aria-label="Trend up"
                            />
                          ) : (
                            <TrendDownIcon
                              className={`w-5 h-5 text-[oklch(0.55_0.20_25)]`}
                              aria-label="Trend down"
                            />
                          )}
                        </div>
                      </td>
                      <td className="hidden px-4 py-4 text-center font-['Inter'] text-[oklch(0.75_0.02_250)] lg:table-cell">
                        {entry.voteCount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer: Last Updated */}
      {!isLoading && lastUpdated && (
        <div className="px-4 py-3 border-t border-[oklch(0.28_0.02_250)] text-xs font-['Inter'] text-[oklch(0.75_0.02_250)]">
          Updated: {lastUpdated}
        </div>
      )}
    </div>
  );
}
