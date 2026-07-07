interface LeaderTickerEntry {
  flag: string;
  name: string;
  trend: 'up' | 'down' | 'neutral';
  approvalPercent: number;
  delta: number; // percentage point change
}

// Seeded with the same mock data used in Leaderboard.demo.tsx
const LEADERS: LeaderTickerEntry[] = [
  { flag: '🇬🇧', name: 'Keir Starmer',           trend: 'up',      approvalPercent: 68, delta: 3.2 },
  { flag: '🇫🇷', name: 'Emmanuel Macron',         trend: 'up',      approvalPercent: 64, delta: 1.8 },
  { flag: '🇩🇪', name: 'Ursula von der Leyen',    trend: 'down',    approvalPercent: 58, delta: -2.4 },
  { flag: '🇺🇸', name: 'Joe Biden',               trend: 'up',      approvalPercent: 54, delta: 0.9 },
  { flag: '🇺🇸', name: 'Donald Trump',            trend: 'down',    approvalPercent: 48, delta: -1.5 },
  { flag: '🇨🇦', name: 'Justin Trudeau',          trend: 'down',    approvalPercent: 42, delta: -3.1 },
  { flag: '🇮🇳', name: 'Narendra Modi',           trend: 'up',      approvalPercent: 71, delta: 4.6 },
  { flag: '🇨🇳', name: 'Xi Jinping',             trend: 'up',      approvalPercent: 62, delta: 0.7 },
  { flag: '🇧🇷', name: 'Lula da Silva',           trend: 'neutral', approvalPercent: 51, delta: 0.0 },
  { flag: '🇿🇦', name: 'Cyril Ramaphosa',         trend: 'down',    approvalPercent: 39, delta: -2.0 },
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
      ? 'text-[oklch(0.62_0.18_142)]'   // green
      : isDown
        ? 'text-[oklch(0.55_0.20_25)]'  // red
        : 'text-[oklch(0.72_0.15_65)]'; // amber/neutral

    return (
      <span key={i} className="leader-ticker-item inline-block">
        <span className="mr-1">{entry.flag}</span>
        <span className="text-[oklch(0.90_0.02_250)] font-medium">{entry.name}</span>
        {' '}
        <span className={`font-semibold tabular-nums ${deltaColor}`}>
          {formatDelta(entry.trend, entry.delta)}
        </span>
        {' '}
        <span className="text-[oklch(0.55_0.03_250)]">
          {entry.approvalPercent}%
        </span>
        {i < doubled.length - 1 && (
          <span className="leader-ticker-sep text-[oklch(0.40_0.02_250)]" aria-hidden="true">   ·   </span>
        )}
      </span>
    );
  });
}

export function LeaderTicker() {
  return (
    <div className="news-ticker-bar flex items-center gap-3 border-b border-[oklch(0.28_0.02_250)] bg-[oklch(0.17_0.03_250)] px-4 py-1.5">
      {/* Chart icon */}
      <span className="flex-shrink-0 text-[oklch(0.72_0.15_65)] text-base leading-none" aria-hidden="true">
        📊
      </span>

      {/* Divider */}
      <span className="h-5 w-px flex-shrink-0 bg-[oklch(0.32_0.02_250)]" aria-hidden="true" />

      {/* LIVE badge — green */}
      <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[oklch(0.62_0.18_142)] font-['Space_Grotesk']">
        <span className="news-live-dot inline-block h-1.5 w-1.5 rounded-full bg-[oklch(0.62_0.18_142)]" />
        Live
      </span>

      {/* Divider */}
      <span className="h-5 w-px flex-shrink-0 bg-[oklch(0.32_0.02_250)]" aria-hidden="true" />

      {/* Scrolling leader strip */}
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="news-ticker whitespace-nowrap text-xs font-['Inter']">
          {buildItems(LEADERS)}
        </div>
      </div>
    </div>
  );
}

export default LeaderTicker;
