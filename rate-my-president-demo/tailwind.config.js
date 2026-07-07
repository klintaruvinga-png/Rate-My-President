/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-navy': 'oklch(0.15 0.04 250)',
        'approve-green': 'oklch(0.62 0.18 142)',
        'disapprove-red': 'oklch(0.55 0.20 25)',
        'amber-accent': 'oklch(0.72 0.15 65)',
        'surface-dark': 'oklch(0.20 0.02 250)',
        'surface-muted': 'oklch(0.28 0.02 250)',
        'text-primary': 'oklch(0.95 0.02 250)',
        'text-secondary': 'oklch(0.75 0.02 250)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        voice: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
