/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand (Navy Ink Base)
        'brand-navy': 'oklch(0.15 0.04 250)',
        
        // Data Accents
        'approve-green': 'oklch(0.62 0.18 142)',
        'disapprove-red': 'oklch(0.55 0.20 25)',
        
        // Tertiary
        'amber-accent': 'oklch(0.72 0.15 65)',
        
        // Supporting Neutrals
        'surface-dark': 'oklch(0.20 0.02 250)',
        'surface-muted': 'oklch(0.28 0.02 250)',
        'text-primary': 'oklch(0.95 0.02 250)',
        'text-secondary': 'oklch(0.75 0.02 250)',
        
        // Home vs Global card backgrounds
        'card-home': 'oklch(0.20 0.02 245)', // Cool navy tint
        'card-global': 'oklch(0.20 0.02 250)', // Neutral navy
      },
      fontFamily: {
        'data': ['Inter', 'system-ui', 'sans-serif'],
        'voice': ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-up': 'slideUp 250ms ease-out',
        'count-up': 'countUp 300ms ease-out',
        'elastic-snap': 'elasticSnap 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        countUp: {
          '0%': {
            opacity: '0.5',
          },
          '100%': {
            opacity: '1',
          },
        },
        elasticSnap: {
          '0%': {
            transform: 'translateX(var(--tw-translate-x))',
          },
          '70%': {
            transform: 'translateX(0) scale(1)',
          },
          '100%': {
            transform: 'translateX(0) scale(1)',
          },
        },
      },
      transitionTimingFunction: {
        'elastic-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-out-quart': 'cubic-bezier(0.165, 0.84, 0.44, 1)',
      },
      borderRadius: {
        // Avatar rounded-square tokens per DESIGN.md
        'avatar-hero': '20px',    // Swipe Card, 120×120px
        'avatar-list': '8px',     // Leaderboard rows, 40×40px
        'avatar-profile': '12px', // Profile, 64×64px
        'avatar-share': '24px',   // Share card, 160×160px
      },
    },
  },
  plugins: [],
};
