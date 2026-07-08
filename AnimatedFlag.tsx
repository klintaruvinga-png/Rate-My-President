import React, { useState } from 'react';
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

const FlagImage: React.FC<{
  code: string;
  fallbackFlag?: string;
  alt: string;
  className: string;
}> = ({ code, fallbackFlag, alt, className }) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const flagUrl = `https://animated-country-flags.malith.dev/webp/${code}.webp`;

  if (status === 'error') {
    if (fallbackFlag) {
      return (
        <span
          className={`${className} inline-flex items-center justify-center leading-none select-none`}
          role="img"
          aria-label={alt}
        >
          {fallbackFlag}
        </span>
      );
    }

    return <CountryIcon className={className} aria-label={alt} />;
  }

  return (
    <div className={`relative inline-flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}>
      {fallbackFlag && status !== 'ready' && (
        <span
          className="absolute inset-0 flex items-center justify-center leading-none select-none"
          style={{ fontSize: '80%', lineHeight: 1 }}
          role="img"
          aria-label={alt}
        >
          {fallbackFlag}
        </span>
      )}
      <img
        key={code}
        src={flagUrl}
        alt={alt}
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

export const AnimatedFlag: React.FC<AnimatedFlagProps> = ({
  countryCode,
  fallbackFlag,
  className = 'w-5 h-5',
  alt,
}) => {
  const flagAltText = alt ?? (countryCode ? `${countryCode} flag` : 'Country flag');
  const code = countryCode ? countryCode.toUpperCase() : undefined;

  if (!code) {
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

  return <FlagImage key={code} code={code} fallbackFlag={fallbackFlag} alt={flagAltText} className={className} />;
};

export default AnimatedFlag;
