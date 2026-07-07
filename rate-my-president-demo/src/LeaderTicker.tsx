import AnimatedFlag from './AnimatedFlag';

interface LeaderTickerEntry {
  countryCode: string;
  fallbackFlag: string;
  name: string;
  trend: 'up' | 'down' | 'neutral';
  approvalPercent: number;
  delta: number; // percentage point change
}

// Seeded with the same mock data used in Leaderboard.demo.tsx
const LEADERS: LeaderTickerEntry[] = [
  { countryCode: 'GB', fallbackFlag: '🇬🇧', name: 'Keir Starmer', trend: 'up', approvalPercent: 68, delta: 3.2 },
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

function formatDelta(trend: 'up' | 'down' | 'neutral', delta: number): string {
  if (trend === 'neutral' || delta === 0) return '→ 0.0%';
  const arrow = trend === 'up' ? '▲' : '▼';
  return `${arrow} ${Math.abs(delta).toFixed(1)}%`;
}

function buildItems(leaders: LeaderTickerEntry[]) {
  const doubled = [...leaders, ...leaders];
  return doubled.map((entry, i) => {
    const isUp = entry.trend === 'up';
    const isDown = entry.trend === 'down';
    const deltaColor = isUp
      ? 'text-[oklch(0.62_0.18_142)]'
      : isDown
        ? 'text-[oklch(0.55_0.20_25)]'
        : 'text-[oklch(0.72_0.15_65)]';

    return (
      <span key={`${entry.name}-${i}`} className="ticker-item">
        <span className="ticker-flag" aria-hidden="true">
          <AnimatedFlag
            countryCode={entry.countryCode}
            fallbackFlag={entry.fallbackFlag}
            className="h-4 w-4 rounded-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
            alt={`${entry.name} flag`}
          />
        </span>
        <span className="ticker-person">{entry.name}</span>
        <span className={`ticker-delta ${deltaColor}`}>{formatDelta(entry.trend, entry.delta)}</span>
        <span className="ticker-copy">{entry.approvalPercent}%</span>
        {i < doubled.length - 1 && <span className="ticker-sep" aria-hidden="true">·</span>}
      </span>
    );
  });
}

export function LeaderTicker() {
  return (
    <div className="ticker-bar">
      <span className="flex-shrink-0 text-[oklch(0.72_0.15_65)] text-base leading-none" aria-hidden="true">
        📊
      </span>

      <span className="ticker-divider" aria-hidden="true" />

      <span className="ticker-label">
        <span className="ticker-live-dot" />
        Live
      </span>

      <span className="ticker-divider" aria-hidden="true" />

      <div className="ticker-track">
        <div className="news-ticker ticker-row">
          {buildItems(LEADERS)}
        </div>
      </div>
    </div>
  );
}

export default LeaderTicker;
