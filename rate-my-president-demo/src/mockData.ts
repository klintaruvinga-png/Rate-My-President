import type { LeaderboardEntry } from './Leaderboard.types';

export interface TickerLeaderEntry {
  countryCode: string;
  fallbackFlag: string;
  name: string;
  trend: 'up' | 'down' | 'neutral';
  approvalPercent: number;
  delta: number;
}

export const tickerLeaders: TickerLeaderEntry[] = [
  { countryCode: 'FR', fallbackFlag: '🇫🇷', name: 'Emmanuel Macron', trend: 'up', approvalPercent: 64, delta: 1.8 },
  { countryCode: 'DE', fallbackFlag: '🇩🇪', name: 'Ursula von der Leyen', trend: 'down', approvalPercent: 58, delta: -2.4 },
  { countryCode: 'US', fallbackFlag: '🇺🇸', name: 'Joe Biden', trend: 'up', approvalPercent: 54, delta: 0.9 },
  { countryCode: 'US', fallbackFlag: '🇺🇸', name: 'Donald Trump', trend: 'down', approvalPercent: 48, delta: -1.5 },
  { countryCode: 'CA', fallbackFlag: '🇨🇦', name: 'Justin Trudeau', trend: 'down', approvalPercent: 42, delta: -3.1 },
  { countryCode: 'IN', fallbackFlag: '🇮🇳', name: 'Narendra Modi', trend: 'up', approvalPercent: 71, delta: 4.6 },
  { countryCode: 'CN', fallbackFlag: '🇨🇳', name: 'Xi Jinping', trend: 'up', approvalPercent: 62, delta: 0.7 },
  { countryCode: 'BR', fallbackFlag: '🇧🇷', name: 'Lula da Silva', trend: 'neutral', approvalPercent: 51, delta: 0.0 },
  { countryCode: 'ZA', fallbackFlag: '🇿🇦', name: 'Cyril Ramaphosa', trend: 'down', approvalPercent: 39, delta: -2.0 },
];

export type LeaderboardWindow = 'day' | 'week' | 'all';

export const leaderboardMockDataByWindow: Record<LeaderboardWindow, LeaderboardEntry[]> = {
  day: [
    { id: '1', rank: 1, name: 'Keir Starmer', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 68, trend: 'up', voteCount: 12450, countryCode: 'GB', countryFlag: '🇬🇧' },
    { id: '2', rank: 2, name: 'Emmanuel Macron', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 64, trend: 'up', voteCount: 11230, countryCode: 'FR', countryFlag: '🇫🇷' },
    { id: '3', rank: 3, name: 'Ursula von der Leyen', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 58, trend: 'down', voteCount: 9870, countryCode: 'DE', countryFlag: '🇩🇪' },
    { id: '4', rank: 4, name: 'Joe Biden', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 54, trend: 'up', voteCount: 14200, countryCode: 'US', countryFlag: '🇺🇸' },
    { id: '5', rank: 5, name: 'Donald Trump', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 48, trend: 'down', voteCount: 13100, countryCode: 'US', countryFlag: '🇺🇸' },
    { id: '6', rank: 6, name: 'Justin Trudeau', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 42, trend: 'down', voteCount: 8960, countryCode: 'CA', countryFlag: '🇨🇦' },
    { id: '7', rank: 7, name: 'Narendra Modi', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 71, trend: 'up', voteCount: 16540, countryCode: 'IN', countryFlag: '🇮🇳' },
    { id: '8', rank: 8, name: 'Xi Jinping', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 62, trend: 'up', voteCount: 10230, countryCode: 'CN', countryFlag: '🇨🇳' },
  ],
  week: [
    { id: '1', rank: 1, name: 'Narendra Modi', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 72, trend: 'up', voteCount: 85600, countryCode: 'IN', countryFlag: '🇮🇳' },
    { id: '2', rank: 2, name: 'Keir Starmer', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 66, trend: 'down', voteCount: 78900, countryCode: 'GB', countryFlag: '🇬🇧' },
    { id: '3', rank: 3, name: 'Emmanuel Macron', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 61, trend: 'up', voteCount: 72100, countryCode: 'FR', countryFlag: '🇫🇷' },
    { id: '4', rank: 4, name: 'Xi Jinping', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 59, trend: 'down', voteCount: 68500, countryCode: 'CN', countryFlag: '🇨🇳' },
    { id: '5', rank: 5, name: 'Joe Biden', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 52, trend: 'up', voteCount: 81200, countryCode: 'US', countryFlag: '🇺🇸' },
    { id: '6', rank: 6, name: 'Ursula von der Leyen', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 55, trend: 'up', voteCount: 64300, countryCode: 'DE', countryFlag: '🇩🇪' },
    { id: '7', rank: 7, name: 'Donald Trump', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 46, trend: 'down', voteCount: 79100, countryCode: 'US', countryFlag: '🇺🇸' },
    { id: '8', rank: 8, name: 'Justin Trudeau', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 39, trend: 'down', voteCount: 56200, countryCode: 'CA', countryFlag: '🇨🇦' },
  ],
  all: [
    { id: '1', rank: 1, name: 'Narendra Modi', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 68, trend: 'up', voteCount: 342100, countryCode: 'IN', countryFlag: '🇮🇳' },
    { id: '2', rank: 2, name: 'Emmanuel Macron', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 62, trend: 'up', voteCount: 298700, countryCode: 'FR', countryFlag: '🇫🇷' },
    { id: '3', rank: 3, name: 'Keir Starmer', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 60, trend: 'down', voteCount: 285400, countryCode: 'GB', countryFlag: '🇬🇧' },
    { id: '4', rank: 4, name: 'Xi Jinping', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 58, trend: 'up', voteCount: 267800, countryCode: 'CN', countryFlag: '🇨🇳' },
    { id: '5', rank: 5, name: 'Joe Biden', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 51, trend: 'down', voteCount: 312600, countryCode: 'US', countryFlag: '🇺🇸' },
    { id: '6', rank: 6, name: 'Ursula von der Leyen', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 53, trend: 'up', voteCount: 241200, countryCode: 'DE', countryFlag: '🇩🇪' },
    { id: '7', rank: 7, name: 'Donald Trump', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 44, trend: 'down', voteCount: 298400, countryCode: 'US', countryFlag: '🇺🇸' },
    { id: '8', rank: 8, name: 'Justin Trudeau', avatarUrl: 'https://via.placeholder.com/40', approvalPercent: 38, trend: 'down', voteCount: 189600, countryCode: 'CA', countryFlag: '🇨🇦' },
  ],
};
