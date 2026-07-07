/**
 * Rate My President — Leaderboard Component Types
 */

/**
 * Single leader ranking entry
 */
export interface LeaderboardEntry {
  /** Unique leader ID */
  id: string;

  /** Current rank (1-based) */
  rank: number;

  /** Full name of the leader */
  name: string;

  /** URL or path to avatar illustration (40x40px) */
  avatarUrl: string;

  /** Approval percentage (0-100) */
  approvalPercent: number;

  /** 7-day trend: positive (↑) or negative (↓) */
  trend: 'up' | 'down';

  /** Total number of votes cast for this leader */
  voteCount: number;

  /** Optional: leader region or continent */
  region?: string;

  /** Optional: timestamp when this ranking was last updated */
  updatedAt?: string;
}

/**
 * Props for the Leaderboard component
 */
export interface LeaderboardProps {
  /**
   * Leaderboard data entries
   */
  entries: LeaderboardEntry[];

  /**
   * Current loading state
   */
  isLoading?: boolean;

  /**
   * Error message (if any)
   */
  error?: string | null;

  /**
   * Current selected time window
   */
  selectedWindow?: 'day' | 'week' | 'all';

  /**
   * Current selected region filter
   */
  selectedRegion?: string;

  /**
   * Available regions for the region toggle
   */
  regions?: string[];

  /**
   * Callback when user switches time window
   */
  onWindowChange?: (window: 'day' | 'week' | 'all') => void;

  /**
   * Callback when user switches region filter
   */
  onRegionChange?: (region: string) => void;

  /**
   * Callback when retrying leaderboard data fetch
   */
  onRetry?: () => void;

  /**
   * Callback when user clicks a leader (e.g., to view details)
   */
  onLeaderClick?: (leaderId: string) => void;

  /**
   * Optional: timestamp showing when data was last updated
   */
  lastUpdated?: string;
}

/**
 * Leaderboard state (internal)
 */
export type LeaderboardSortColumn = 'rank' | 'approval' | 'trend' | 'votes';
export type LeaderboardSortDirection = 'asc' | 'desc';

export interface LeaderboardSortState {
  column: LeaderboardSortColumn;
  direction: LeaderboardSortDirection;
}
