import React, { useState, useEffect } from 'react';
import { CountryIcon } from './Icons';

export interface AnimatedFlagProps {
  /** ISO 2-letter country code (e.g., 'US', 'GB') */
  countryCode?: string;
  /** Fallback static emoji or icon representation (e.g., '🇺🇸') */
  fallbackFlag?: string;
  /** Custom sizing or styling classes */
  className?: string;
  /** Accessibility label for assistive technologies */
  alt?: string;
}

export const AnimatedFlag: React.FC<AnimatedFlagProps> = ({
  countryCode,
  fallbackFlag,
  className = 'w-5 h-5',
  alt,
}) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Reset when the country changes so stale state from a previous card never shows
  useEffect(() => {
    setStatus('loading');
  }, [countryCode]);

  const flagAltText = alt ?? (countryCode ? `${countryCode} flag` : 'Country flag');

  // ── No country code, or remote image failed ──────────────────────────────
  if (!countryCode || status === 'error') {
    if (fallbackFlag) {
      return (
        <span
          className={`${className} inline-flex items-center justify-center leading-none select-none`}
          role="img"
          aria-label={flagAltText}
        >
          {fallbackFlag}
        </span>
      );
    }
    return <CountryIcon className={className} aria-label={flagAltText} />;
  }

  const code = countryCode.toUpperCase();
  const flagUrl = `https://animated-country-flags.malith.dev/webp/${code}.webp`;

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}
    >
      {/* ── Immediate emoji fallback: visible while the remote image loads ── */}
      {fallbackFlag && status !== 'ready' && (
        <span
          className="absolute inset-0 flex items-center justify-center leading-none select-none"
          // Fill ~80% of the container regardless of size.
          style={{ fontSize: '80%', lineHeight: 1 }}
          role="img"
          aria-label={flagAltText}
        >
          {fallbackFlag}
        </span>
      )}

      {/* ── Remote animated WebP; fades in once loaded ── */}
      <img
        src={flagUrl}
        alt={flagAltText}
        loading="eager"
        decoding="async"
        className={`w-full h-full object-contain transition-opacity duration-200 ${
          status === 'ready' ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setStatus('ready')}
        onError={() => setStatus('error')}
      />
    </div>
  );
};

export default AnimatedFlag;
