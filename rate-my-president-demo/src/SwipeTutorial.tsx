import React from 'react';
import headerImage from './assets/obama-header.png';

export const SwipeTutorial: React.FC = () => {
  return (
    <div className="w-full max-w-xs mx-auto py-4 relative flex flex-col items-center select-none overflow-visible">
      {/* Self-contained CSS Keyframes */}
      <style>{`
        @keyframes tutorial-card {
          /* 0s - 2s: Swipe Right */
          0% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          /* Approach (0.2s) */
          5% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          /* Press (0.3s) */
          7.5% {
            transform: translate3d(0, 0, 0) scale(0.98) rotate(0deg);
            opacity: 1;
          }
          /* Motion (0.5s): Translate right + rotate */
          12.5% {
            transform: translate3d(70px, 0, 0) scale(0.98) rotate(4deg);
            opacity: 1;
          }
          /* Release & Slide Off (0.65s) */
          16.25% {
            transform: translate3d(240px, -10px, 0) scale(1) rotate(12deg);
            opacity: 0;
          }
          /* Reset (0.8s) */
          20% {
            transform: translate3d(0, 20px, 0) scale(0.9);
            opacity: 0;
          }
          23.75% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          /* Pause at center */
          50% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }

          /* 2s - 4s: Swipe Left */
          55% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          /* Press (2.3s) */
          57.5% {
            transform: translate3d(0, 0, 0) scale(0.98) rotate(0deg);
            opacity: 1;
          }
          /* Motion (2.5s): Translate left + rotate */
          62.5% {
            transform: translate3d(-70px, 0, 0) scale(0.98) rotate(-4deg);
            opacity: 1;
          }
          /* Release & Slide Off (2.65s) */
          66.25% {
            transform: translate3d(-240px, -10px, 0) scale(1) rotate(-12deg);
            opacity: 0;
          }
          /* Reset (2.8s) */
          70% {
            transform: translate3d(0, 20px, 0) scale(0.9);
            opacity: 0;
          }
          73.75% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes tutorial-hand {
          /* 0s - 2s: Swipe Right */
          0% {
            transform: translate3d(-40px, 20px, 0) scale(1.1);
            opacity: 0;
            filter: blur(4px);
          }
          /* Approach: moves onto left side of card */
          5% {
            transform: translate3d(10px, 40px, 0) scale(1);
            opacity: 1;
            filter: blur(0);
          }
          /* Press: shrinks 10% */
          7.5% {
            transform: translate3d(10px, 40px, 0) scale(0.9);
            opacity: 1;
          }
          /* Motion: drag right */
          12.5% {
            transform: translate3d(80px, 40px, 0) scale(0.9);
            opacity: 1;
          }
          /* Release: scale back and fade out */
          16.25% {
            transform: translate3d(100px, 35px, 0) scale(1);
            opacity: 0;
          }
          20%, 50% {
            transform: translate3d(180px, 20px, 0) scale(1.1);
            opacity: 0;
          }

          /* 2s - 4s: Swipe Left */
          50% {
            transform: translate3d(180px, 20px, 0) scale(1.1);
            opacity: 0;
            filter: blur(4px);
          }
          /* Approach: moves onto right side of card */
          55% {
            transform: translate3d(130px, 40px, 0) scale(1);
            opacity: 1;
            filter: blur(0);
          }
          /* Press: shrinks 10% */
          57.5% {
            transform: translate3d(130px, 40px, 0) scale(0.9);
            opacity: 1;
          }
          /* Motion: drag left */
          62.5% {
            transform: translate3d(60px, 40px, 0) scale(0.9);
            opacity: 1;
          }
          /* Release: scale back and fade out */
          66.25% {
            transform: translate3d(40px, 35px, 0) scale(1);
            opacity: 0;
          }
          70%, 100% {
            transform: translate3d(-40px, 20px, 0) scale(1.1);
            opacity: 0;
          }
        }

        @keyframes tutorial-ripple {
          0%, 5% {
            transform: scale(0);
            opacity: 0;
          }
          /* Press (5% - 7.5%) */
          6.5% {
            transform: scale(0.5);
            opacity: 0.8;
          }
          8% {
            transform: scale(1.8);
            opacity: 0;
          }
          9%, 50% {
            transform: scale(0);
            opacity: 0;
          }
          /* Press (55% - 57.5%) */
          55% {
            transform: scale(0);
            opacity: 0;
          }
          56.5% {
            transform: scale(0.5);
            opacity: 0.8;
          }
          58% {
            transform: scale(1.8);
            opacity: 0;
          }
          59%, 100% {
            transform: scale(0);
            opacity: 0;
          }
        }

        @keyframes tutorial-badge-approve {
          0%, 7.5% {
            opacity: 0;
            transform: scale(0.8) rotate(-10deg);
          }
          10%, 14% {
            opacity: 0.95;
            transform: scale(1) rotate(-8deg);
          }
          16.25%, 100% {
            opacity: 0;
            transform: scale(1.1) rotate(-5deg);
          }
        }

        @keyframes tutorial-badge-disapprove {
          0%, 57.5% {
            opacity: 0;
            transform: scale(0.8) rotate(10deg);
          }
          60%, 64% {
            opacity: 0.95;
            transform: scale(1) rotate(8deg);
          }
          66.25%, 100% {
            opacity: 0;
            transform: scale(1.1) rotate(5deg);
          }
        }

        @keyframes tutorial-prompt-right {
          0%, 45% {
            opacity: 1;
            transform: translateY(0);
          }
          48%, 100% {
            opacity: 0;
            transform: translateY(-4px);
          }
        }

        @keyframes tutorial-prompt-left {
          0%, 48% {
            opacity: 0;
            transform: translateY(4px);
          }
          52%, 95% {
            opacity: 1;
            transform: translateY(0);
          }
          98%, 100% {
            opacity: 0;
            transform: translateY(-4px);
          }
        }

        .animate-tutorial-card {
          animation: tutorial-card 4s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }

        .animate-tutorial-hand {
          animation: tutorial-hand 4s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }

        .animate-tutorial-ripple {
          animation: tutorial-ripple 4s ease-out infinite;
        }

        .animate-badge-approve {
          animation: tutorial-badge-approve 4s ease-out infinite;
        }

        .animate-badge-disapprove {
          animation: tutorial-badge-disapprove 4s ease-out infinite;
        }

        .animate-prompt-right {
          animation: tutorial-prompt-right 4s ease-in-out infinite;
        }

        .animate-prompt-left {
          animation: tutorial-prompt-left 4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-tutorial-card,
          .animate-tutorial-hand,
          .animate-tutorial-ripple,
          .animate-badge-approve,
          .animate-badge-disapprove,
          .animate-prompt-right,
          .animate-prompt-left {
            animation: none !important;
          }
        }
      `}</style>

      {/* Track & Guidelines */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center justify-between px-2 pointer-events-none z-0">
        <span className="text-[oklch(0.55_0.20_25)] text-[10px] font-bold uppercase tracking-wider bg-[oklch(0.15_0.04_250)] px-1.5 py-0.5 rounded border border-[oklch(0.55_0.20_25)]/20">
          ✕ No Like
        </span>
        <div className="flex-1 mx-2 border-t border-dashed border-[oklch(0.28_0.02_250)] h-0"></div>
        <span className="text-[oklch(0.62_0.18_142)] text-[10px] font-bold uppercase tracking-wider bg-[oklch(0.15_0.04_250)] px-1.5 py-0.5 rounded border border-[oklch(0.62_0.18_142)]/20">
          Like ✓
        </span>
      </div>

      {/* Core Animation Wrapper */}
      <div className="w-[200px] h-[190px] relative overflow-visible flex items-center justify-center z-10">
        {/* Mock Card */}
        <div className="w-[140px] h-[170px] bg-[oklch(0.20_0.02_250)] border border-[oklch(0.28_0.02_250)] rounded-2xl overflow-hidden shadow-lg relative animate-tutorial-card will-change-transform">
          {/* Branded Header Image */}
          <div className="w-full h-[100px] flex items-center justify-center bg-[oklch(0.18_0.02_250)]">
            <img 
              src={headerImage} 
              alt="Rate My President" 
              className="w-16 h-16 object-contain rounded-lg"
            />
          </div>

          {/* Label */}
          <div className="p-3 space-y-2">
            <div className="h-2 w-full bg-[oklch(0.75_0.02_250)]/40 rounded"></div>
            <div className="h-1.5 w-3/4 bg-[oklch(0.75_0.02_250)]/20 rounded"></div>
          </div>

          {/* Stamp Overlays */}
          {/* Approve Overlay */}
          <div className="absolute top-6 left-2 border-2 border-[oklch(0.62_0.18_142)] text-[oklch(0.62_0.18_142)] text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md opacity-0 animate-badge-approve pointer-events-none select-none">
            Like
          </div>

          {/* Disapprove Overlay */}
          <div className="absolute top-6 right-2 border-2 border-[oklch(0.55_0.20_25)] text-[oklch(0.55_0.20_25)] text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md opacity-0 animate-badge-disapprove pointer-events-none select-none">
            No Like
          </div>
        </div>

        {/* Pointer / Hand Wrapper */}
        <div className="absolute left-0 top-0 w-12 h-12 pointer-events-none animate-tutorial-hand will-change-transform z-20 overflow-visible">
          {/* Ripple behind fingertip */}
          <div className="absolute top-[4px] left-[24px] w-6 h-6 rounded-full border border-[oklch(0.72_0.15_65)] bg-[oklch(0.72_0.15_65)]/20 -translate-x-1/2 -translate-y-1/2 scale-0 opacity-0 animate-tutorial-ripple"></div>

          {/* Vector Open Palm Hand */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-12 h-12 text-[oklch(0.95_0.02_250)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] rotate-[-10deg]"
          >
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
          </svg>
        </div>
      </div>

      {/* Floating Synchronized Text Prompts */}
      <div className="relative h-6 w-full text-center mt-3 text-xs font-semibold uppercase tracking-widest font-['Space_Grotesk'] text-[oklch(0.72_0.15_65)]">
        <span className="absolute inset-x-0 mx-auto opacity-0 animate-prompt-right">
          👉 Swipe Right to Like
        </span>
        <span className="absolute inset-x-0 mx-auto opacity-0 animate-prompt-left">
          👈 Swipe Left to No Like
        </span>
      </div>
    </div>
  );
};

export default SwipeTutorial;
