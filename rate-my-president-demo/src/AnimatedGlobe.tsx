import { useEffect, useRef } from 'react';

function LandMasses() {
  return (
    <g transform="translate(12 24) scale(0.84 0.84)">
      <path
        d="M24 58c10-14 28-20 46-18 14 2 24 8 31 17 8 13 7 31-1 45-8 11-21 19-35 20-17 1-32-8-42-20-7-9-6-19 1-24Z"
        fill="#D0A57A"
        stroke="#111625"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M44 118c8-10 19-15 30-15 9 0 17 3 22 9 6 6 9 15 8 24-1 9-6 18-13 23-8 5-18 7-28 6-11-1-20-7-26-15-5-8-7-18-3-27Z"
        fill="#D0A57A"
        stroke="#111625"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M92 42c7-10 19-14 32-13 11 1 21 6 28 14 8 9 11 20 10 31-1 13-8 23-19 31-9 6-20 10-31 8-13-2-24-11-28-23-4-10-2-20 3-28 3-5 5-8 5-21Z"
        fill="#D0A57A"
        stroke="#111625"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M134 50c10-13 26-17 42-15 13 2 23 8 32 18 7 9 9 21 8 32-2 13-10 23-20 31-7 5-16 9-25 8-12-2-22-10-26-21-4-11-1-21 3-30 2-4 4-7 4-15Z"
        fill="#D0A57A"
        stroke="#111625"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M168 126c5-5 12-7 19-6 5 1 9 3 12 6 4 5 3 11 0 15-3 4-8 6-13 5-6-1-11-4-14-8-2-4-2-7-4-12Z"
        fill="#D0A57A"
        stroke="#111625"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M102 20c8-6 18-8 28-7 8 1 16 4 22 9 6 6 8 14 7 22-1 6-4 11-8 15-5 4-11 6-17 5-8-1-15-5-20-11-4-5-5-11-4-18 0-4 1-8 2-15Z"
        fill="#D0A57A"
        stroke="#111625"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export default function AnimatedGlobe() {
  const continentLayerRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    const layer = continentLayerRef.current;
    if (!layer) {
      return;
    }

    let offset = 0;
    let frameId = 0;
    const speed = 0.35;
    const width = 260;

    const animate = () => {
      offset -= speed;
      if (offset <= -width) {
        offset = 0;
      }

      layer.setAttribute('transform', `translate(${offset}, 0)`);
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="mx-auto my-0 flex w-full max-w-[130px] items-center justify-center">
      <svg
        viewBox="0 0 260 260"
        className="h-[90px] w-[90px] drop-shadow-[0_20px_40px_rgba(0,0,0,0.22)] sm:h-[110px] sm:w-[110px]"
        role="img"
        aria-label="Animated globe illustration"
      >
        <defs>
          <clipPath id="globeMask">
            <circle cx="130" cy="130" r="120" />
          </clipPath>
          <linearGradient id="globeHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id="globeShadow" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.18)" />
            <stop offset="45%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>

        <circle cx="130" cy="130" r="120" fill="#3A567B" />

        <g clipPath="url(#globeMask)">
          <g ref={continentLayerRef} transform="translate(0, 0)">
            <g transform="translate(0 0)">
              <LandMasses />
            </g>
            <g transform="translate(260 0)">
              <LandMasses />
            </g>
          </g>
        </g>

        <rect x="18" y="18" width="224" height="224" rx="112" fill="url(#globeHighlight)" />
        <rect x="18" y="18" width="224" height="224" rx="112" fill="url(#globeShadow)" />

        <circle cx="130" cy="130" r="120" fill="none" stroke="#111625" strokeWidth="5" />
      </svg>
    </div>
  );
}
