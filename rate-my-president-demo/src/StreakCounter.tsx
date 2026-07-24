import { StreakIcon } from '@root/Icons';

interface StreakCounterProps {
  /** Current consecutive-day vote streak. */
  streak: number;
}

/**
 * Gamified streak indicator. Amber accent (DESIGN.md `amber-accent`), flame icon,
 * polite aria-live so screen readers announce streak changes without interrupting.
 */
export function StreakCounter({ streak }: StreakCounterProps) {
  const active = streak > 0;
  return (
    <div
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold font-['Space_Grotesk'] border transition-colors motion-reduce:transition-none ${
        active
          ? 'bg-[oklch(0.72_0.15_65)]/15 text-[oklch(0.72_0.15_65)] border-[oklch(0.72_0.15_65)]/40'
          : 'bg-[oklch(0.20_0.02_250)] text-[oklch(0.75_0.02_250)] border-[oklch(0.28_0.02_250)]'
      }`}
    >
      <StreakIcon className="w-4 h-4" aria-hidden="true" />
      <span>
        {active ? `${streak}-day streak` : 'No streak yet'}
      </span>
    </div>
  );
}

export default StreakCounter;
