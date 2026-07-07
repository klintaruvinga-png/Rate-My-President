import React from 'react';

export const SwipeTutorial: React.FC = () => {
  return (
    <div className="w-full max-w-xs mx-auto py-4 relative flex flex-col items-center select-none overflow-visible">
      {/* Self-contained CSS Keyframes */}
      <style>{`
        @keyframes tutorial-card {
          /* 0s - 4s: Swipe Right */
          0% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          /* Approach (0.4s) */
          5% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          /* Press (0.6s) */
          7.5% {
            transform: translate3d(0, 0, 0) scale(0.98) rotate(0deg);
            opacity: 1;
          }
          /* Motion (1.0s): Translate right + rotate */
          12.5% {
            transform: translate3d(70px, 0, 0) scale(0.98) rotate(4deg);
            opacity: 1;
          }
          /* Release & Slide Off (1.3s) */
          16.25% {
            transform: translate3d(240px, -10px, 0) scale(1) rotate(12deg);
            opacity: 0;
          }
          /* Reset (1.6s) */
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

          /* 4s - 8s: Swipe Left */
          55% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          /* Press (4.6s) */
          57.5% {
            transform: translate3d(0, 0, 0) scale(0.98) rotate(0deg);
            opacity: 1;
          }
          /* Motion (5.0s): Translate left + rotate */
          62.5% {
            transform: translate3d(-70px, 0, 0) scale(0.98) rotate(-4deg);
            opacity: 1;
          }
          /* Release & Slide Off (5.3s) */
          66.25% {
            transform: translate3d(-240px, -10px, 0) scale(1) rotate(-12deg);
            opacity: 0;
          }
          /* Reset (5.6s) */
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
          /* 0s - 4s: Swipe Right */
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

          /* 4s - 8s: Swipe Left */
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
          animation: tutorial-card 8s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }

        .animate-tutorial-hand {
          animation: tutorial-hand 8s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }

        .animate-tutorial-ripple {
          animation: tutorial-ripple 8s ease-out infinite;
        }

        .animate-badge-approve {
          animation: tutorial-badge-approve 8s ease-out infinite;
        }

        .animate-badge-disapprove {
          animation: tutorial-badge-disapprove 8s ease-out infinite;
        }

        .animate-prompt-right {
          animation: tutorial-prompt-right 8s ease-in-out infinite;
        }

        .animate-prompt-left {
          animation: tutorial-prompt-left 8s ease-in-out infinite;
        }
      `}</style>

      {/* Track & Guidelines */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center justify-between px-2 pointer-events-none z-0">
        <span className="text-[oklch(0.55_0.20_25)] text-[10px] font-bold uppercase tracking-wider bg-[oklch(0.15_0.04_250)] px-1.5 py-0.5 rounded border border-[oklch(0.55_0.20_25)]/20">
          ✕ Disapprove
        </span>
        <div className="flex-1 mx-2 border-t border-dashed border-[oklch(0.28_0.02_250)] h-0"></div>
        <span className="text-[oklch(0.62_0.18_142)] text-[10px] font-bold uppercase tracking-wider bg-[oklch(0.15_0.04_250)] px-1.5 py-0.5 rounded border border-[oklch(0.62_0.18_142)]/20">
          Approve ✓
        </span>
      </div>

      {/* Core Animation Wrapper */}
      <div className="w-[200px] h-[190px] relative overflow-visible flex items-center justify-center z-10">
        {/* Mock Card */}
        <div className="w-[140px] h-[170px] bg-[oklch(0.20_0.02_250)] border border-[oklch(0.28_0.02_250)] rounded-2xl p-4 flex flex-col items-center justify-between text-center shadow-lg relative animate-tutorial-card will-change-transform">
          {/* Flag Stamp */}
          <div className="w-8 h-8 rounded-full bg-[oklch(0.28_0.02_250)] flex items-center justify-center text-sm shadow-inner">
            🌎
          </div>

          {/* Profile Circle */}
          <div className="w-14 h-14 rounded-full bg-[oklch(0.15_0.04_250)] border border-[oklch(0.28_0.02_250)] flex items-center justify-center overflow-hidden shadow-inner">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-[oklch(0.75_0.02_250)] opacity-60" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>

          {/* Label */}
          <div className="space-y-1">
            <div className="h-2 w-16 bg-[oklch(0.75_0.02_250)]/40 rounded mx-auto"></div>
            <div className="h-1.5 w-10 bg-[oklch(0.75_0.02_250)]/20 rounded mx-auto"></div>
          </div>

          {/* Stamp Overlays */}
          {/* Approve Overlay */}
          <div className="absolute top-6 left-2 border-2 border-[oklch(0.62_0.18_142)] text-[oklch(0.62_0.18_142)] text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md opacity-0 animate-badge-approve pointer-events-none select-none">
            Approve
          </div>

          {/* Disapprove Overlay */}
          <div className="absolute top-6 right-2 border-2 border-[oklch(0.55_0.20_25)] text-[oklch(0.55_0.20_25)] text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md opacity-0 animate-badge-disapprove pointer-events-none select-none">
            No Like
          </div>
        </div>

        {/* Pointer / Hand Wrapper */}
        <div className="absolute left-0 top-0 w-12 h-12 pointer-events-none animate-tutorial-hand will-change-transform z-20 overflow-visible">
          {/* Ripple behind index finger */}
          <div className="absolute top-[3px] left-[15px] w-6 h-6 rounded-full border border-[oklch(0.72_0.15_65)] bg-[oklch(0.72_0.15_65)]/20 -translate-x-1/2 -translate-y-1/2 scale-0 opacity-0 animate-tutorial-ripple"></div>

          {/* Vector Pointing Finger */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-12 h-12 text-[oklch(0.95_0.02_250)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] rotate-[-15deg]"
          >
            {/* Index finger pointing up */}
            <path d="M10 9V2.5a1.5 1.5 0 0 1 3 0V11" />
            {/* Folded fingers */}
            <path d="M13 6.5a1.5 1.5 0 0 1 3 0v4.5" />
            <path d="M16 8.5a1.5 1.5 0 0 1 3 0V12" />
            <path d="M19 10.5a1.5 1.5 0 0 1 3 0V14c0 4-3 6-7 6h-2c-3.5 0-6-2.5-6-6V9.5a1.5 1.5 0 0 1 3 0V12" />
            {/* Thumb */}
            <path d="M4.5 12a1.5 1.5 0 0 1 1.5-1.5h1" />
          </svg>
        </div>
      </div>

      {/* Floating Synchronized Text Prompts */}
      <div className="relative h-6 w-full text-center mt-3 text-xs font-semibold uppercase tracking-widest font-['Space_Grotesk'] text-[oklch(0.72_0.15_65)]">
        <span className="absolute inset-x-0 mx-auto opacity-0 animate-prompt-right">
          👉 Swipe Right to Approve
        </span>
        <span className="absolute inset-x-0 mx-auto opacity-0 animate-prompt-left">
          👈 Swipe Left to Disapprove
        </span>
      </div>
    </div>
  );
};

export default SwipeTutorial;
