import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ChevronDownIcon } from '@root/Icons';
import type { KeyboardEvent } from 'react';
import type { LeaderboardProps, LeaderboardSortState } from './Leaderboard.types';
import AnimatedFlag from '@root/AnimatedFlag';
import { TrendUpIcon, TrendDownIcon } from '@root/Icons';

export default function Leaderboard({
  entries,
  isLoading = false,
  error = null,
  selectedWindow = 'day',
  selectedRegion = 'global',
  regions,
  onWindowChange,
  onRegionChange,
  onRetry,
  onLeaderClick,
  lastUpdated,
}: LeaderboardProps) {
  const [sortState, setSortState] = useState<LeaderboardSortState>({
    column: 'rank',
    direction: 'asc',
  });
  const [localRegion, setLocalRegion] = useState<string>(selectedRegion || 'global');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeDropdownRef = useRef<HTMLDivElement>(null);

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
    if (!regionDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRegionDropdownOpen(false);
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setRegionDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [regionDropdownOpen]);

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

  useEffect(() => {
    setLocalRegion(selectedRegion || 'global');
  }, [selectedRegion]);

  const regionOptions = regions && regions.length > 0
    ? ['global', ...regions.filter((region) => region !== 'global')]
    : ['global', 'Americas', 'Europe', 'Asia', 'Africa', 'Oceania'];

  const timeOptions = ['day', 'week', 'all'] as const;
  const timeLabels = { day: 'Today', week: 'This Week', all: 'All-Time' };

  const handleRegionChange = useCallback(
    (region: string) => {
      setLocalRegion(region);
      if (onRegionChange) onRegionChange(region);
    },
    [onRegionChange]
  );

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    } else {
      // Fallback for consumers that didn't provide onRetry
      window.location.reload();
    }
  }, [onRetry]);

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

  const filteredEntries = useMemo(() => {
    if (localRegion === 'global') return sortedEntries;
    return sortedEntries.filter((entry) => entry.region === localRegion);
  }, [sortedEntries, localRegion]);

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
    if (avatarUrl.startsWith('/avatars/thumbs/')) {
      return avatarUrl;
    }
    if (avatarUrl.startsWith('/avatars/')) {
      return avatarUrl.replace('/avatars/', '/avatars/thumbs/');
    }
    return avatarUrl;
  };

  const handleHeaderKeyDown = (event: KeyboardEvent<HTMLTableHeaderCellElement>, column: 'rank' | 'approval' | 'votes') => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleColumnClick(column);
    }
  };

  // Skeleton loader component
  const SkeletonRow = () => (
    <tr className="border-b border-[oklch(0.28_0.02_250)] animate-pulse">
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
    <div className="w-full overflow-hidden rounded-[24px] border border-[oklch(0.28_0.02_250)] bg-[oklch(0.15_0.04_250)] text-[oklch(0.95_0.02_250)] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">

      <div className="flex flex-wrap items-center gap-2 border-b border-[oklch(0.28_0.02_250)] bg-[oklch(0.18_0.03_250)] px-3 py-2 sm:px-6 sm:py-3">
        {/* Time Selection Dropdown */}
        <div className="relative" ref={timeDropdownRef}>
          <button
            onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
            aria-expanded={timeDropdownOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-['Space_Grotesk'] transition-all bg-[oklch(0.20_0.02_250)] text-[oklch(0.95_0.02_250)] hover:bg-[oklch(0.28_0.02_250)]"
          >
            {timeLabels[selectedWindow]}
            <ChevronDownIcon className="w-4 h-4" />
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

        {/* Desktop: Button pills */}
        <div className="hidden lg:flex flex-wrap gap-2">
          {regionOptions.map((region) => (
            <button
              key={region}
              onClick={() => handleRegionChange(region)}
              aria-pressed={localRegion === region}
              className={`rounded-full px-3 py-2 text-sm font-['Space_Grotesk'] transition-all ${
                localRegion === region
                  ? 'bg-[oklch(0.62_0.18_142)] text-white'
                  : 'bg-[oklch(0.20_0.02_250)] text-[oklch(0.75_0.02_250)] hover:bg-[oklch(0.28_0.02_250)]'
              }`}
            >
              {region === 'global' ? 'Global' : region}
            </button>
          ))}
        </div>

        {/* Mobile: Dropdown */}
        <div className="lg:hidden relative" ref={dropdownRef}>
          <button
            onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
            aria-expanded={regionDropdownOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-['Space_Grotesk'] transition-all bg-[oklch(0.20_0.02_250)] text-[oklch(0.95_0.02_250)] hover:bg-[oklch(0.28_0.02_250)]"
          >
            {localRegion === 'global' ? 'Global' : localRegion}
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          {regionDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 z-20 bg-[oklch(0.20_0.02_250)] rounded-lg border border-[oklch(0.28_0.02_250)] shadow-lg min-w-[150px]">
              {regionOptions.map((region) => (
                <button
                  key={region}
                  onClick={() => {
                    handleRegionChange(region);
                    setRegionDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-['Space_Grotesk'] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    localRegion === region
                      ? 'bg-[oklch(0.62_0.18_142)] text-white'
                      : 'text-[oklch(0.75_0.02_250)] hover:bg-[oklch(0.28_0.02_250)] hover:text-[oklch(0.95_0.02_250)]'
                  }`}
                >
                  {region === 'global' ? 'Global' : region}
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
            onClick={handleRetry}
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
                  onKeyDown={(e) => handleHeaderKeyDown(e, 'rank')}
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
                  onKeyDown={(e) => handleHeaderKeyDown(e, 'approval')}
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
                  onKeyDown={(e) => handleHeaderKeyDown(e, 'votes')}
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
                : filteredEntries.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className="border-b border-[oklch(0.28_0.02_250)] hover:bg-[oklch(0.20_0.02_250)] transition-colors group animate-[fadeIn_0.2s_ease-out]"
                      style={{ animationDelay: `${index * 20}ms` }}
                    >
                      <td className="w-12 px-2 py-2 font-['Inter'] font-600 text-[oklch(0.75_0.02_250)] sm:px-3 sm:py-3">
                        #{entry.rank}
                      </td>
                      <td
                        className="px-2 py-2 cursor-pointer sm:px-3 sm:py-3"
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
                              if (target.src.includes('/avatars/thumbs/')) {
                                target.src = entry.avatarUrl;
                              } else {
                                target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="%230f172a"/><circle cx="60" cy="50" r="24" fill="%23e2e8f0"/><path d="M28 104c8-18 24-26 32-26s24 8 32 26" fill="%23e2e8f0"/></svg>';
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
                      <td className="px-2 py-2 text-center font-['Inter'] font-700 text-sm sm:text-base sm:px-3 sm:py-3">
                        <span
                          className={entry.approvalPercent >= 50 ? 'text-[oklch(0.62_0.18_142)]' : 'text-[oklch(0.55_0.20_25)]'}
                        >
                          {entry.approvalPercent}%
                        </span>
                      </td>
                      <td className="hidden px-2 py-2 text-center sm:px-3 sm:py-3 md:table-cell">
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
                      <td className="hidden px-2 py-2 text-center font-['Inter'] text-[oklch(0.75_0.02_250)] sm:px-3 sm:py-3 lg:table-cell">
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
        <div className="border-t border-[oklch(0.28_0.02_250)] px-3 py-2 text-xs font-['Inter'] text-[oklch(0.75_0.02_250)] sm:px-6 sm:py-3">
          Updated: {lastUpdated}
        </div>
      )}
    </div>
  );
}
