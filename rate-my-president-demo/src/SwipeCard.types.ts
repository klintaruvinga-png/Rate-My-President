/**
 * Rate My President — Swipe Card Component Types
 *
 * These types define the data structures and callbacks for the SwipeCard component.
 * Import these in any component that uses SwipeCard.
 */

/**
 * Vote action type
 */
export type VoteAction = 'like' | 'nolike' | 'skip' | null;

/**
 * Card type (Home = user's own country, Global = randomly assigned)
 */
export type CardType = 'home' | 'global';

/**
 * Trend direction for approval rating
 */
export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Individual headline/news article associated with a leader
 */
export interface Headline {
  /** Headline text/title */
  title: string;

  /** News source name (e.g., 'BBC News', 'Reuters') */
  source: string;

  /** Publish date (e.g., 'Jul 5, 2026') */
  date: string;

  /** URL to the full article (opens in new tab) */
  url: string;
}

/**
 * Complete card data — everything displayed on a swipe card
 */
export interface CardData {
  /** Unique identifier for this card */
  id: string;

  /** Type of card: Home (user's leader) or Global (random) */
  type: CardType;

  /** ISO 3166-1 alpha-2 country code (e.g., 'GB', 'FR', 'JP') */
  countryCode: string;

  /** Full country name for display (e.g., 'United Kingdom', 'France') */
  countryName: string;

  /** Unicode flag emoji for the country (e.g., '🇬🇧', '🇫🇷') */
  countryFlag: string;

  /** Leader/president name (recommended ≤30 chars, max 60 for localization) */
  leaderName: string;

  /** URL to leader avatar image (SVG or raster, 120×120px recommended) */
  avatarUrl: string;

  /** Approval rating as integer percentage (0–100) */
  approvalPercent: number;

  /** 7-day trend direction */
  trend: TrendDirection;

  /** Array of associated headlines/news articles (show up to 2) */
  headlines: Headline[];

  /**
   * Optional: User's vote on this leader yesterday.
   * Used for micro-history display ("Yesterday: Approve ✓")
   * If not provided, micro-history is not shown.
   */
  yesterdayVote?: 'like' | 'nolike' | 'skip';
}

/**
 * Props for the SwipeCard component
 */
export interface SwipeCardProps {
  /** Complete card data to display */
  card: CardData;

  /** Optional card underneath the top card in the stack */
  nextCard?: CardData;

  /** Callback fired when user casts a vote (like/nolike/skip) */
  onVote: (action: VoteAction) => void;

  /**
   * Optional: Set to true to show a loading state (disables interaction)
   * @default false
   */
  isLoading?: boolean;

  /**
   * Optional: Show the "Yesterday: X" micro-history line
   * @default true
   */
  showMicroHistory?: boolean;
}

/**
 * Results card data (returned after vote is cast)
 * This is what appears after the vote animation
 */
export interface ResultsData {
  /** The vote action that was cast */
  voteAction: VoteAction;

  /** Current approval % (may differ from the original card if vote hasn't synced to server yet) */
  approvalPercent: number;

  /** Updated trend direction */
  trend: TrendDirection;

  /** Associated headlines */
  headlines: Headline[];

  /** User's vote from yesterday (if applicable) */
  yesterdayVote?: VoteAction;
}

/**
 * Extended vote record for analytics/tracking
 */
export interface VoteRecord {
  /** Card ID that was voted on */
  cardId: string;

  /** Card type (home or global) */
  cardType: CardType;

  /** Country code of the voted leader */
  countryCode: string;

  /** Vote action (like/nolike/skip) */
  action: VoteAction;

  /** Timestamp of when vote was cast */
  timestamp: Date;

  /** Duration user spent on the card before voting (milliseconds) */
  timeSpentMs?: number;

  /** Whether vote was submitted from gesture vs button/keyboard */
  inputMethod?: 'gesture' | 'button' | 'keyboard';
}
