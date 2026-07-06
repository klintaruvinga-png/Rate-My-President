# SwipeCard Component — Production Documentation

## Overview

`SwipeCard` is a production-ready React + TypeScript component that implements the swipe-card interaction for Rate My President. It handles all user input (swipe, button, keyboard), state management, accessibility, and motion according to the final design brief.

**Status:** Ready for integration into a React/Next.js app with Tailwind CSS.

## Features

- ✅ **Gesture support:** Left/right swipe with real-time visual feedback
- ✅ **Button fallback:** Approve/Disapprove/Skip buttons (desktop hover, mobile always visible)
- ✅ **Keyboard support:** Arrow keys and WASD equivalents (Right/D = approve, Left/A = disapprove, Up/S = skip)
- ✅ **Touch support:** Full touchmove drag detection for mobile
- ✅ **Haptic feedback:** Optional vibration on swipe release (uses `navigator.vibrate` if available)
- ✅ **Accessibility:** Semantic HTML, ARIA labels, focus management, screen-reader announcements
- ✅ **Responsive design:** Works on mobile, tablet, desktop (button visibility adjusts per device)
- ✅ **Staggered reveals:** Results card fades in with staggered number → confirmation → news timeline
- ✅ **Micro-history:** Optional "Yesterday: Approve ✓" text to reinforce continuity
- ✅ **Error states:** Placeholder handling for missing avatars, empty headlines, etc.

## Component Props

```typescript
interface CardData {
  id: string;                          // Unique card ID
  type: 'home' | 'global';            // Card type (affects badge and background color)
  countryCode: string;                 // ISO country code (e.g., 'GB')
  countryName: string;                 // Country display name (e.g., 'United Kingdom')
  countryFlag: string;                 // Emoji flag (e.g., '🇬🇧')
  leaderName: string;                  // President/leader name (≤60 chars)
  avatarUrl: string;                   // URL to leader avatar image (120×120px recommended)
  approvalPercent: number;             // 0–100 approval rating
  trend: 'up' | 'down' | 'neutral';   // 7-day trend direction
  headlines: Array<{
    title: string;                     // Headline text
    source: string;                    // Source name (e.g., 'BBC News')
    date: string;                      // Publish date (e.g., 'Jul 5, 2026')
    url: string;                       // Outbound link
  }>;
  yesterdayVote?: 'approve' | 'disapprove' | 'skip'; // Optional: for micro-history
}

interface SwipeCardProps {
  card: CardData;                      // Card data (required)
  onVote: (action: VoteAction) => void; // Callback when vote is cast
  isLoading?: boolean;                 // Show loading state (disables interaction)
  showMicroHistory?: boolean;          // Show "Yesterday: X" text (default: true)
}

type VoteAction = 'approve' | 'disapprove' | 'skip' | null;
```

## Usage Example

```typescript
import SwipeCard from './SwipeCard';

function App() {
  const handleVote = (action) => {
    console.log('User voted:', action);
    // Submit vote to API, fetch next card, etc.
  };

  const card = {
    id: 'leader-1',
    type: 'home',
    countryCode: 'GB',
    countryName: 'United Kingdom',
    countryFlag: '🇬🇧',
    leaderName: 'Keir Starmer',
    avatarUrl: '/avatars/keir-starmer.svg',
    approvalPercent: 47,
    trend: 'down',
    headlines: [
      {
        title: 'PM announces new initiative',
        source: 'BBC News',
        date: 'Jul 5, 2026',
        url: 'https://bbc.com/...',
      },
    ],
    yesterdayVote: 'approve',
  };

  return (
    <SwipeCard
      card={card}
      onVote={handleVote}
      showMicroHistory={true}
    />
  );
}
```

## Design System Integration

### Colors (Tailwind)

The component uses OKLCH colors defined in `tailwind.config.js`. All colors are available as Tailwind utilities:

- `bg-brand-navy` — Primary navy ink base
- `bg-approve-green` — Approve accent
- `bg-disapprove-red` — Disapprove accent
- `bg-amber-accent` — Tertiary (streaks, non-vote UI)
- `bg-surface-dark` — Card background
- `bg-card-home` — Home card background (cool navy)
- `bg-card-global` — Global card background (neutral navy)
- `text-text-primary` — Primary text
- `text-text-secondary` — Secondary text

### Typography (Tailwind)

- `font-data` → Inter (for all numbers, stats, data)
- `font-voice` → Space Grotesk (for headlines, copy, confirmation)

### Motion

The component handles all motion inline (CSS transitions). For more advanced animation orchestration, use the `animate.md` reference as guidance:

- **Fast dismissal (card exit):** 150ms snap
- **Results fade-in:** 250ms concurrent with card exit
- **Staggered reveals:** Number (300ms) → Confirmation (+150ms) → News (+150ms)
- **Elastic easing:** Used for swipe snap (see `tailwind.config.js` for curve)

## Interaction Model

### Swipe Gesture

- Drag left/right on the card
- Visual feedback: card tilts, opacity fades on off-drag side
- Threshold: 40% of card width to register as intentional swipe
- Partial drag + release: card snaps back to center
- Mobile: Haptic feedback on release (10ms vibration pulse)

### Button Fallback

- **Desktop:** Buttons hidden by default, appear on card hover
- **Mobile:** Icon-only buttons always visible below card (lower opacity)
- **Accessibility:** Both are semantically labeled with `aria-label`

### Keyboard Shortcuts

| Key(s) | Action |
|--------|--------|
| Right Arrow / D | Approve |
| Left Arrow / A | Disapprove |
| Up Arrow / S | Skip |

### Vote Flow

1. User initiates action (swipe/button/keyboard)
2. Card animates off-screen (150ms snap)
3. Results card fades in from center (concurrent 250ms)
4. Approval % appears (300ms staggered)
5. Confirmation text fades in (+150ms)
6. Headlines/history fade in (+150ms)
7. Next affordance visible → user can advance

## Accessibility

### Screen Reader Support

- Each button has an `aria-label` (e.g., "Approve", "Disapprove", "Skip")
- Card section is marked with `role="region"` and `aria-label="Daily leader card"`
- Trend arrows have semantic labels (e.g., "up trending")
- Micro-history text is descriptive (not just emoji)

### Keyboard Navigation

- Swipe card is not a form, so tab order is manual
- Buttons are tab-accessible and can be activated with Enter or Space
- Keyboard shortcuts (Arrow keys) are always available

### Focus Management

- Focused element receives a 2px offset ring
- Color matches the action (green for approve, red for disapprove, muted for skip)
- Focus ring is visible at all times

### Motion Accessibility

- No `prefers-reduced-motion` is implemented in the component itself
- Instead, motion is restrained and fast (≤300ms) to avoid motion sickness
- Consider adding a global `prefers-reduced-motion` handler at the app level if needed (example below)

**Global reduced-motion support (add to app root):**

```typescript
// In your app's main CSS or global styles
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Responsive Behavior

| Breakpoint | Changes |
|---|---|
| **Mobile (< 768px)** | Buttons appear as icon-only below card (always visible); card width: 320px |
| **Tablet (768–1024px)** | Card width increases to 360px; buttons still icon-only on hover |
| **Desktop (>1024px)** | Buttons appear on hover; full text labels visible |

## State Management

The component is **presentational only**. All state (card data, vote history, next cards) is managed by the parent component or app-level state management (Redux, Zustand, context, etc.).

Parent is responsible for:
- Fetching/providing card data
- Handling the `onVote` callback
- Transitioning to next card
- Persisting vote data

Example parent logic:

```typescript
const [currentCard, setCurrentCard] = useState(initialCard);
const [isLoading, setIsLoading] = useState(false);

const handleVote = async (action) => {
  setIsLoading(true);

  try {
    // Submit vote to API
    await api.submitVote({
      cardId: currentCard.id,
      action,
      timestamp: new Date(),
    });

    // Fetch next card
    const nextCard = await api.getNextCard();
    setCurrentCard(nextCard);
  } catch (error) {
    console.error('Vote failed:', error);
  } finally {
    setIsLoading(false);
  }
};

return (
  <SwipeCard
    card={currentCard}
    onVote={handleVote}
    isLoading={isLoading}
  />
);
```

## Styling & Customization

The component uses inline Tailwind classes and accepts OKLCH colors via `tailwind.config.js`. To customize:

1. **Colors:** Edit `tailwind.config.js` theme.colors
2. **Typography:** Edit `tailwind.config.js` theme.fontFamily
3. **Spacing/sizing:** Adjust Tailwind padding, margins, widths in the component code
4. **Motion:** Update animation durations in `tailwind.config.js` keyframes

**Do not override via external CSS** — keep all styling in Tailwind config or inline classes for maintainability.

## Browser Support

- Modern browsers with ES2020+ support
- Touch events support (iOS Safari, Chrome, Firefox, Edge)
- Haptic feedback: only on browsers that support `navigator.vibrate` (gracefully ignored if unavailable)
- OKLCH color support: all modern browsers (fallback to hex or rgb if needed for older browsers)

## Performance Notes

- Component re-renders only on state changes (drag, vote, reveal stage)
- No external dependencies beyond React + Tailwind
- Swipe detection is optimized with throttled move events
- Images should be optimized (120×120px avatars, lazy-loaded if many cards)

## Known Limitations

1. **Avatar images:** Component expects valid image URLs. Implement error handling in parent if needed.
2. **Headline count:** Component shows up to 2 headlines. If more than 2 are provided, extras are ignored.
3. **Leader name length:** Names >60 chars may wrap awkwardly. Parent should validate/truncate.
4. **Haptic feedback:** Only works on mobile browsers that support `navigator.vibrate`. Silently ignored elsewhere.

## Future Enhancements

- Haptic patterns (different feedback for approve vs disapprove)
- Gesture customization (e.g., swipe-up for some actions)
- Drag-release threshold tweaking per device type
- Integration with analytics (track swipe start, release, etc. for UX research)

## Changelog

**v1.0.0 (2026-07-06)** — Initial production release

- Core swipe gesture with visual feedback
- Button + keyboard fallbacks
- Staggered results reveal
- Micro-history support
- Full accessibility support
- Responsive design (mobile/tablet/desktop)
- Haptic feedback on mobile
