import { useState, useEffect } from 'react';

/**
 * A hook that provides a countdown timer to a target timestamp.
 * @param targetTime - The timestamp (in ms) to count down to
 * @returns The remaining milliseconds until the target time
 */
export function useCountdownTimer(targetTime?: number): number {
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    targetTime ? Math.max(0, targetTime - Date.now()) : 0
  );

  useEffect(() => {
    if (!targetTime) {
      setRemainingMs(0);
      return;
    }

    setRemainingMs(Math.max(0, targetTime - Date.now()));
    const intervalId = window.setInterval(() => {
      setRemainingMs(Math.max(0, targetTime - Date.now()));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [targetTime]);

  return remainingMs;
}

/**
 * Formats milliseconds into a human-readable duration string.
 * @param milliseconds - The duration in milliseconds
 * @returns Formatted string like "2h 30m 15s"
 */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
