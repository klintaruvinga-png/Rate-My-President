# Onboarding Integration Guide

## Quick Start

You have three files ready for integration:

1. **`Onboarding.tsx`** — Main component (production-ready)
2. **`Onboarding.types.ts`** — TypeScript interfaces
3. **`Onboarding.demo.tsx`** — Example usage
4. **`ONBOARDING.md`** — Complete documentation

## Setup Steps

### 1. Copy Component Files

```
src/
  components/
    Onboarding/
      Onboarding.tsx
      Onboarding.types.ts
      Onboarding.demo.tsx
      index.ts (optional)
```

Create `src/components/Onboarding/index.ts`:

```typescript
export { default as Onboarding } from './Onboarding';
export * from './Onboarding.types';
```

### 2. Prepare Country Data

Create a file with your country list:

```typescript
// lib/countries.ts
import { CountryData } from '@/components/Onboarding';

export const AVAILABLE_COUNTRIES: CountryData[] = [
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', leader: 'Keir Starmer' },
  { code: 'US', name: 'United States', flag: '🇺🇸', leader: 'Joe Biden' },
  { code: 'FR', name: 'France', flag: '🇫🇷', leader: 'Emmanuel Macron' },
  // ... add all tracked countries
];

// Sort by some priority (popularity, alphabetical, user locale, etc.)
export const COUNTRIES_SORTED = AVAILABLE_COUNTRIES.sort((a, b) =>
  a.name.localeCompare(b.name)
);
```

### 3. Integrate into App

```typescript
import { Onboarding } from '@/components/Onboarding';
import { COUNTRIES_SORTED } from '@/lib/countries';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

function App() {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check localStorage for existing onboarding state
  useEffect(() => {
    const stored = localStorage.getItem('rate_my_president:onboarded');
    const storedCountry = localStorage.getItem('rate_my_president:country_code');

    if (stored === 'true') {
      setHasOnboarded(true);
      setUserCountry(storedCountry);
    }

    setIsLoading(false);
  }, []);

  const handleOnboardingComplete = (countryCode: string | null) => {
    // Persist to localStorage
    localStorage.setItem('rate_my_president:onboarded', 'true');
    localStorage.setItem('rate_my_president:country_code', countryCode || '');

    // Update app state
    setUserCountry(countryCode);
    setHasOnboarded(true);

    // Optional: Submit to API
    // await api.saveUserProfile({ countryCode });

    // Navigate to main app (after a brief transition)
    setTimeout(() => {
      router.push('/app');
    }, 500);
  };

  if (isLoading) {
    return null; // or loading spinner
  }

  // Show onboarding if user hasn't completed it yet
  if (!hasOnboarded) {
    return (
      <Onboarding
        availableCountries={COUNTRIES_SORTED}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Otherwise show main app (SwipeCard, leaderboards, etc.)
  return <MainApp userCountry={userCountry} />;
}
```

### 4. Handle Settings/Change Country Later

Add a settings screen where users can change their country:

```typescript
function SettingsPage() {
  const [currentCountry, setCurrentCountry] = useState<string | null>(null);

  const handleChangeCountry = (newCountryCode: string | null) => {
    localStorage.setItem('rate_my_president:country_code', newCountryCode || '');
    setCurrentCountry(newCountryCode);
    
    // Optional: Sync to API
    // await api.updateUserProfile({ countryCode: newCountryCode });
  };

  return (
    <div>
      <h1>Settings</h1>
      {/* Show current country selection with ability to change */}
      <CountryPicker
        value={currentCountry}
        onChange={handleChangeCountry}
      />
    </div>
  );
}
```

## Data Flow

```
App Init
  ↓
Check localStorage for `onboarded` flag
  ↓
  If not onboarded:
    Show Onboarding component
      ↓
      User completes flow (selects country or skips)
      ↓
      onComplete() callback fires with country code
      ↓
      Store in localStorage
      ↓
      Navigate to /app (SwipeCard)
  ↓
  If onboarded:
    Load user's country from localStorage
    ↓
    Render main app with user country as context
```

## State Management Pattern

**Option A: localStorage (simple)**

```typescript
const handleOnboardingComplete = (countryCode: string | null) => {
  localStorage.setItem('rate_my_president:country_code', countryCode || '');
  router.push('/app');
};
```

**Option B: Context + localStorage (medium)**

```typescript
const UserContext = createContext<{ countryCode: string | null }>({ countryCode: null });

function UserProvider({ children }) {
  const [countryCode, setCountryCode] = useState<string | null>(null);

  useEffect(() => {
    setCountryCode(localStorage.getItem('rate_my_president:country_code'));
  }, []);

  return (
    <UserContext.Provider value={{ countryCode }}>
      {children}
    </UserContext.Provider>
  );
}
```

**Option C: API + localStorage (full)**

```typescript
const handleOnboardingComplete = async (countryCode: string | null) => {
  // Submit to API
  const response = await fetch('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify({ countryCode }),
  });

  if (response.ok) {
    localStorage.setItem('rate_my_president:country_code', countryCode || '');
    router.push('/app');
  }
};
```

## Country Data Source

You'll need to manage a list of countries. Options:

1. **Hardcoded:** Add to a config file (simplest, good for MVP)
   ```typescript
   export const COUNTRIES = [
     { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', leader: '...' },
     // ...
   ];
   ```

2. **API endpoint:** Fetch from backend (more flexible)
   ```typescript
   const response = await fetch('/api/countries');
   const countries = await response.json();
   ```

3. **Third-party library:** Use `iso-3166-1` or similar
   ```typescript
   import { countries } from 'iso-3166-1';
   ```

**Recommendation for MVP:** Hardcoded list in a config file. Add API-fetching later if you need dynamic updates.

## Testing

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import Onboarding from '@/components/Onboarding';

describe('Onboarding', () => {
  it('should show intro screen on mount', () => {
    render(
      <Onboarding
        availableCountries={mockCountries}
        onComplete={() => {}}
      />
    );

    expect(screen.getByText('Rate My President')).toBeInTheDocument();
  });

  it('should call onComplete with country code when user selects country', async () => {
    const handleComplete = jest.fn();

    render(
      <Onboarding
        availableCountries={mockCountries}
        onComplete={handleComplete}
      />
    );

    // Navigate through walkthrough
    const letsGoBtn = screen.getByText('Let's go');
    fireEvent.click(letsGoBtn);

    // Click through mechanic screens
    const nextBtns = screen.getAllByText('Next');
    fireEvent.click(nextBtns[0]); // Home
    fireEvent.click(nextBtns[1]); // Global
    fireEvent.click(nextBtns[2]); // Summary

    // Select country
    const selectBtn = screen.getByText(/Select your country/);
    fireEvent.click(selectBtn);

    const countryOption = screen.getByText('United Kingdom');
    fireEvent.click(countryOption);

    const continueBtn = screen.getByText(/Continue with/);
    fireEvent.click(continueBtn);

    // Complete and check callback
    const startBtn = screen.getByText('Start swiping');
    fireEvent.click(startBtn);

    expect(handleComplete).toHaveBeenCalledWith('GB');
  });

  it('should allow user to skip country selection', async () => {
    const handleComplete = jest.fn();

    render(
      <Onboarding
        availableCountries={mockCountries}
        onComplete={handleComplete}
      />
    );

    // Navigate to country selection (fast-forward)
    // ... (skip through walkthrough)

    const skipBtn = screen.getByText('Prefer not to say');
    fireEvent.click(skipBtn);

    const startBtn = screen.getByText('Start swiping');
    fireEvent.click(startBtn);

    expect(handleComplete).toHaveBeenCalledWith(null);
  });
});
```

### E2E Tests (Playwright)

```typescript
test('User can complete onboarding and see first swipe card', async ({ page }) => {
  await page.goto('/');

  // Intro screen
  await page.click('text=Let's go');

  // Mechanic walkthrough
  await page.click('text=Next');
  await page.click('text=Next');
  await page.click('text=Next');

  // Country selection
  await page.click('text=Select your country');
  await page.fill('input[placeholder="Search countries..."]', 'United');
  await page.click('text=United Kingdom');
  await page.click('text=Continue with');

  // Confirmation
  await page.click('text=Start swiping');

  // Verify we're on SwipeCard now
  await page.waitForSelector('[data-testid="swipe-card"]');
  expect(await page.isVisible('[data-testid="swipe-card"]')).toBe(true);
});
```

## Performance & Analytics

### Track Onboarding Metrics

```typescript
const handleOnboardingComplete = (countryCode: string | null) => {
  // Fire analytics event
  analytics.track('onboarding_completed', {
    countryCode: countryCode || 'skipped',
    timestamp: new Date().toISOString(),
  });

  // Time spent in onboarding
  const timeSpent = Date.now() - onboardingStartTime;
  analytics.track('onboarding_time', { ms: timeSpent });
};
```

### Questions to Track

- What % of users complete vs. skip country selection?
- How long does onboarding take?
- Which country is most popular?
- Do users who skip return to set country later?

## Troubleshooting

### Geolocation not detecting country

- Check browser console for geolocation errors
- Ensure HTTPS (geolocation requires secure context)
- Verify user has granted geolocation permission
- Add fallback: use IP-based geolocation service (e.g., ip-api.com)

### Autocomplete search is slow

- Limit country list to most relevant countries (e.g., top 50)
- Implement debouncing if filtering large lists
- Use CSS `will-change: transform` on list items

### Layout broken on mobile

- Ensure tailwind.config.js is properly loaded
- Check mobile viewport meta tag (`<meta name="viewport" content="..."`)
- Test on actual mobile device (not just browser dev tools)

---

**Ready to ship!** 🚀

See ONBOARDING.md for complete API documentation.
