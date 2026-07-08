import AnimatedFlag from '@root/AnimatedFlag';
import { tickerLeaders } from './mockData';

function formatDelta(trend: 'up' | 'down' | 'neutral', delta: number): string {
  if (trend === 'neutral' || delta === 0) return '→ 0.0%';
  const arrow = trend === 'up' ? '▲' : '▼';
  return `${arrow} ${Math.abs(delta).toFixed(1)}%`;
}

function buildItems(leaders: typeof tickerLeaders) {
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
          {buildItems(tickerLeaders)}
        </div>
      </div>
    </div>
  );
}

export default LeaderTicker;
