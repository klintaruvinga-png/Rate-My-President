# Onboarding Component — Production Documentation

## Overview

`Onboarding` is a production-ready React + TypeScript component that implements the first-run experience for Rate My President. It guides new users through a multi-step flow: mechanic explanation (3 screens) → country selection → confirmation → handoff to first swipe.

**Status:** Ready for integration into a React/Next.js app with Tailwind CSS.

## Features

- ✅ **Multi-step mechanic walkthrough:** Intro → Home card → Global card → Summary
- ✅ **Country selection:** Searchable autocomplete with geolocation detection
- ✅ **Explicit skip option:** "Prefer not to say" with equal visual weight (no dark patterns)
- ✅ **Confirmation screens:** Different messaging for country-selected vs. skipped flows
- ✅ **Warm, playful tone:** Lighter than the daily ritual, uses Space Grotesk (voice typeface)
- ✅ **Geolocation-aware:** Detects user's country as helpful default (not enforced)
- ✅ **Back navigation:** Users can revisit previous screens
- ✅ **Responsive design:** Mobile-first, optimized for all screen sizes
- ✅ **TypeScript types:** Full coverage
- ✅ **Accessibility:** Semantic HTML, focus management, screen-reader support
- ✅ **Auto-advance:** Smooth transition to first swipe card on completion

## Component Props

```typescript
interface OnboardingProps {
  /**
   * Callback fired when user completes onboarding.
   * @param countryCode ISO country code if selected, null if skipped
   */
  onComplete: (countryCode: string | null) => void;

  /**
   * Optional: Callback if user exits early
   */
  onSkip?: () => void;

  /**
   * Array of available countries for selection.
   * Should be sorted (e.g., by popularity or user locale).
   */
  availableCountries: CountryData[];
}

interface CountryData {
  code: string;           // e.g., 'GB'
  name: string;           // e.g., 'United Kingdom'
  flag: string;           // e.g., '🇬🇧'
  leader?: string;        // Optional: name to show on confirmation
}
```

## Usage Example

```typescript
import Onboarding from './Onboarding';
import { CountryData } from './Onboarding.types';

function App() {
  const countries: CountryData[] = [
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', leader: 'Keir Starmer' },
    { code: 'US', name: 'United States', flag: '🇺🇸', leader: 'Joe Biden' },
    // ... more countries
  ];

  const handleOnboardingComplete = (countryCode: string | null) => {
    if (countryCode) {
      console.log('User selected:', countryCode);
    } else {
      console.log('User skipped country selection');
    }
    // Store in localStorage or app state
    // Navigate to first SwipeCard
  };

  return (
    <Onboarding
      availableCountries={countries}
      onComplete={handleOnboardingComplete}
    />
  );
}
```

## Screen Flow

```
1. Intro
   └─→ "Rate My President" + CTA

2. Mechanic Walkthrough (3 screens)
   ├─→ Home card explanation
   ├─→ Global card explanation
   └─→ Summary: "One swipe, two perspectives"

3. Country Selection
   ├─→ Searchable autocomplete with geolocation default
   ├─→ User selects or taps "Prefer not to say"

4. Confirmation
   ├─→ If country selected: Show leader avatar + "Got it!" message
   └─→ If skipped: Show "You'll get Global cards only" message

5. Auto-advance to SwipeCard
```

## Interaction Model

### Screen Progression

- **Next/Continue buttons** advance to the next screen
- **Back buttons** return to the previous screen (available on all screens after intro)
- **Search input** filters country list as user types
- **Country tap** selects that country and enables Continue button
- **"Prefer not to say" button** skips country selection with equal visual weight

### Geolocation & Privacy

- The component now asks for explicit consent before using the browser Geolocation API. A small prompt appears on the country-selection screen: "Allow using your location to preselect your country?".
- If the user consents, the component requests the device location and performs a reverse-geocoding lookup to suggest a default country. The reverse-geocoding call is cancellable and times out after 8s.
- If the user declines or the request fails, the onboarding flow falls back to manual country selection and does not send coordinates.
- Note: the demo uses the public Nominatim endpoint for reverse geocoding. For production, replace this with a provider that allows your traffic volume and supports an identifying `Referer`/contact header, or perform reverse geocoding server-side to avoid exposing user coordinates to third parties.

### Form Validation

- Country must be explicitly selected **or** "Prefer not to say" tapped
- No silent defaults
- Continue button is disabled until a choice is made

### Completion Flow

- After confirmation screen, `onComplete()` callback is fired
- Component fades out (300ms transition)
- Parent app receives country code (or null) and can navigate to SwipeCard

## Design System Integration

### Colors (Tailwind)

The component uses the same OKLCH color system as the main app:

- `bg-[oklch(0.15_0.04_250)]` — Navy ink base
- `bg-[oklch(0.20_0.02_250)]` — Card background
- `text-[oklch(0.95_0.02_250)]` — Primary text
- `text-[oklch(0.75_0.02_250)]` — Secondary text
- `bg-[oklch(0.62_0.18_142)]` — Approve green (buttons)

### Typography

- **Headings / primary copy:** Space Grotesk (voice typeface, warmer, playful)
- **Secondary / metadata:** Space Grotesk or Inter (consistent with system)

### Tone

**Different from SwipeCard:**

- More playful, welcoming
- Uses more emoji and visual storytelling
- "Let's go" instead of "Continue"
- Celebration on confirmation (even if brief)

**Consistent with SwipeCard:**

- Same color palette
- Same fonts
- Calm, intentional pacing
- No excessive animation

## Responsive Behavior

| Breakpoint | Changes |
|---|---|
| **Mobile (< 768px)** | Single column, full-width inputs, stacked buttons |
| **Tablet (768–1024px)** | Same as mobile (not breakpoint-dependent) |
| **Desktop (>1024px)** | Same layout, touch-friendly sizing preserved |

**Key:** Component is mobile-first and keeps responsive-friendly spacing throughout (e.g., 44px minimum touch targets, full-width buttons).

## Accessibility

### Screen Reader Support

- Heading levels are semantic (h1 for main screen heading, h2 for explanatory text)
- Buttons have descriptive labels (e.g., "Continue with 🇬🇧 United Kingdom")
- Form input has associated placeholder and label context
- Screen reader announcements for country selection confirmation

### Keyboard Navigation

- Tab through buttons and search input
- Enter to submit forms / advance screens
- Escape could be added (optional) to exit onboarding

### Focus Management

- Focus moves naturally through screen progression
- Visible focus indicators (Tailwind default focus rings)
- All interactive elements are keyboard-accessible

### Motion Accessibility

- No `prefers-reduced-motion` handling in component (all motion is ≤300ms and essential to UX)
- Fade transition on completion is subtle and avoidable at app level if needed

## State Management

The component is **presentational only**. Parent is responsible for:

- Storing country selection (localStorage, app state, database)
- Navigating to SwipeCard after completion
- Managing "user has already onboarded" logic (don't show onboarding again)

Example parent logic:

```typescript
const [hasOnboarded, setHasOnboarded] = useState(false);
const [userCountry, setUserCountry] = useState<string | null>(null);

useEffect(() => {
  // Check if user has completed onboarding before
  const stored = localStorage.getItem('user_country_code');
  if (stored) {
    setHasOnboarded(true);
    setUserCountry(stored);
  }
}, []);

const handleOnboardingComplete = (countryCode: string | null) => {
  setUserCountry(countryCode);
  setHasOnboarded(true);
  
  // Persist to localStorage
  localStorage.setItem('user_country_code', countryCode || '');
  
  // Navigate to SwipeCard
  router.push('/app');
};

if (!hasOnboarded) {
  return <Onboarding availableCountries={countries} onComplete={handleOnboardingComplete} />;
}

return <SwipeCard card={currentCard} onVote={handleVote} />;
```

## API Integration

Onboarding itself is UI-only, but you may need this backend endpoint:

### GET `/api/countries`

Returns a list of available countries for onboarding.

**Response:**

```json
[
  {
    "code": "GB",
    "name": "United Kingdom",
    "flag": "🇬🇧",
    "leader": "Keir Starmer"
  },
  {
    "code": "US",
    "name": "United States",
    "flag": "🇺🇸",
    "leader": "Donald Trump"
  }
]
```

Or fetch this list from a config file / hardcoded in your app.

## Performance Notes

- Component is lightweight (~280 lines)
- No external dependencies beyond React + Tailwind
- Geolocation detection is non-blocking (fires on mount, doesn't block rendering)
- Country search is client-side filtered (fast enough for up to 200+ countries)

## Browser Support

- Modern browsers with ES2020+ support
- Geolocation API (optional, gracefully falls back)
- OKLCH color support (all modern browsers; fallback if needed)

## Known Limitations

1. **Geolocation:** Requires user permission; fails silently if denied
2. **Country list:** Must be provided by parent (component doesn't fetch countries automatically)
3. **Leader names:** Optional; confirmation screen is less visually rich if not provided
4. **Search:** Client-side only; no fuzzy matching (exact string match on name/code)

## Future Enhancements

- Fuzzy search for country names
- Sorting by proximity or user locale
- Region-based filtering (e.g., "Europe", "Asia")
- Integration with IP geolocation as fallback
- Analytics tracking (which countries skip, how long in onboarding, etc.)

## Changelog

**v1.0.0 (2026-07-06)** — Initial production release

- Full multi-step mechanic walkthrough
- Searchable country selection with geolocation
- Explicit skip option (no dark patterns)
- Confirmation screens (country-selected vs. skipped)
- Back navigation throughout flow
- Responsive design
- Full accessibility support
- TypeScript types
