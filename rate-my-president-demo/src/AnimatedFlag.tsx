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
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset status if countryCode changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [countryCode]);

  const flagAltText = alt ?? (countryCode ? `${countryCode} flag` : 'Country flag');

  if (!countryCode || hasError) {
    if (fallbackFlag) {
      return (
        <span className={`${className} inline-flex items-center justify-center font-['Inter'] leading-none select-none`} role="img" aria-label={flagAltText}>
          {fallbackFlag}
        </span>
      );
    }
    return <CountryIcon className={className} aria-label={flagAltText} />;
  }

  const code = countryCode.toUpperCase();
  const flagUrl = `https://animated-country-flags.malith.dev/webp/${code}.webp`;

  return (
    <div className={`relative inline-flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white/10 rounded animate-pulse" />
      )}
      <img
        src={flagUrl}
        alt={flagAltText}
        className={`${className} object-contain transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
};

export default AnimatedFlag;
