# Integration Guide — SwipeCard Component

## Quick Start

You have three files ready for integration:

1. **`SwipeCard.tsx`** — The main component (production-ready)
2. **`SwipeCard.types.ts`** — TypeScript interfaces (import for type safety)
3. **`SwipeCard.demo.tsx`** — Example usage and demo
4. **`tailwind.config.js`** — Tailwind color palette (merge with your existing config)

## Setup Steps

### 1. Install Dependencies

```bash
npm install react react-dom tailwindcss
# or yarn / pnpm
```

### 2. Set Up Tailwind CSS

If you don't have Tailwind configured, install and init:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Then merge the color/theme config from `tailwind.config.js` into your project's `tailwind.config.js`:

```javascript
// tailwind.config.js
module.exports = {
  // ... existing config ...
  theme: {
    extend: {
      colors: {
        'brand-navy': 'oklch(0.15 0.04 250)',
        'approve-green': 'oklch(0.62 0.18 142)',
        'disapprove-red': 'oklch(0.55 0.20 25)',
        // ... (add the rest from the provided config)
      },
      fontFamily: {
        'data': ['Inter', 'system-ui', 'sans-serif'],
        'voice': ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      // ... (add animations, etc.)
    },
  },
};
```

### 3. Import Fonts

Add Inter and Space Grotesk to your HTML or CSS:

```html
<!-- In your HTML <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Or via CSS (`@import` in your main CSS file):

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
```

### 4. Copy Component Files

Copy these files to your project (adjust paths as needed):

```
src/
  components/
    SwipeCard/
      SwipeCard.tsx
      SwipeCard.types.ts
      SwipeCard.demo.tsx
      index.ts (optional, for easier imports)
```

Create `src/components/SwipeCard/index.ts`:

```typescript
export { default as SwipeCard } from './SwipeCard';
export * from './SwipeCard.types';
```

## Basic Usage

### Minimal Example

```typescript
import { SwipeCard, CardData } from '@/components/SwipeCard';

function MyApp() {
  const [card, setCard] = useState<CardData>(/* ... */);

  const handleVote = (action) => {
    console.log('User voted:', action);
    // TODO: Submit to API, fetch next card
  };

  return (
    <SwipeCard
      card={card}
      onVote={handleVote}
    />
  );
}
```

### Full Example with State Management

```typescript
import { SwipeCard, CardData, VoteAction } from '@/components/SwipeCard';
import { useEffect, useState } from 'react';

function RateMyPresident() {
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState<boolean>(false);

  // Fetch initial card on mount
  useEffect(() => {
    fetchCard();
  }, []);

  const fetchCard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cards/next');
      const card = await response.json();
      setCurrentCard(card);
      setHasVoted(false);
    } catch (error) {
      console.error('Failed to fetch card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (action: VoteAction) => {
    if (!currentCard || hasVoted) return;

    setIsLoading(true);
    setHasVoted(true);

    try {
      // Submit vote to API
      const voteResponse = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: currentCard.id,
          action,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!voteResponse.ok) throw new Error('Vote failed');

      // Wait a moment for smooth UX, then fetch next card
      setTimeout(() => {
        fetchCard();
      }, 1500);
    } catch (error) {
      console.error('Vote failed:', error);
      setHasVoted(false); // Allow retry
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentCard) {
    return (
      <div className="min-h-screen bg-[oklch(0.15_0.04_250)] flex items-center justify-center">
        <p className="text-[oklch(0.75_0.02_250)]">Loading your daily cards...</p>
      </div>
    );
  }

  return (
    <SwipeCard
      card={currentCard}
      onVote={handleVote}
      isLoading={isLoading}
      showMicroHistory={true}
    />
  );
}

export default RateMyPresident;
```

## API Endpoints You'll Need

The component itself is UI-only, but your backend will need these endpoints:

### GET `/api/cards/next`

Returns the next card to display.

**Response:**

```json
{
  "id": "leader-123",
  "type": "home",
  "countryCode": "GB",
  "countryName": "United Kingdom",
  "countryFlag": "🇬🇧",
  "leaderName": "Keir Starmer",
  "avatarUrl": "/avatars/keir-starmer.svg",
  "approvalPercent": 47,
  "trend": "down",
  "headlines": [
    {
      "title": "PM announces new policy",
      "source": "BBC News",
      "date": "Jul 5, 2026",
      "url": "https://bbc.com/..."
    }
  ],
  "yesterdayVote": "approve"
}
```

### POST `/api/votes`

Submit a vote.

**Request:**

```json
{
  "cardId": "leader-123",
  "action": "approve",
  "timestamp": "2026-07-06T15:30:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "voteId": "vote-456",
  "recorded": true
}
```

### GET `/api/votes/today` (optional)

Get today's vote summary or history.

**Response:**

```json
{
  "homeVoted": true,
  "homeVote": "approve",
  "globalVoted": false,
  "votesRemaining": 1,
  "streakDays": 5
}
```

## Key Implementation Decisions

### State Management Pattern

Choose one approach:

**Option A: Lifting state up** (simple, small apps)

```typescript
// App.tsx holds card state, passes to SwipeCard
```

**Option B: Context + Hooks** (medium apps)

```typescript
// Create useCardContext hook, wrap app with CardProvider
```

**Option C: Redux / Zustand** (large apps)

```typescript
// Store manages card queue, votes, user preferences
```

### Vote Submission Strategy

**Optimistic UI** (recommended):

```typescript
// 1. Show results immediately (assume success)
// 2. Submit to API in background
// 3. If API fails, show error and retry option
```

**Conservative** (safer for strict vote integrity):

```typescript
// 1. Show loading state
// 2. Wait for API success before showing results
// 3. If API fails, let user retry without leaving card
```

### Daily Reset Logic

Implement server-side or client-side:

**Server-side** (recommended):

- Track daily reset time per user in database
- Return `votesRemaining` in `/api/cards/next`
- Guard endpoints with timestamp validation

**Client-side** (fallback):

- Use `localStorage` with timestamp
- Reset on app load if midnight has passed
- Keep small risk of edge cases (user in different timezone, etc.)

### Card Queue Strategy

**Pull (on-demand)**:
- Request next card only after user votes
- Simpler, less backend load
- Slight delay between cards

**Push (preload)**:
- Fetch next card while user is looking at current one
- Faster UX
- More backend load

**Hybrid** (recommended):
- Fetch next card after vote is submitted (parallel with UI animation)
- User never waits

## Testing

### Unit Tests (vitest / Jest)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SwipeCard } from '@/components/SwipeCard';

describe('SwipeCard', () => {
  it('should call onVote when user swipes right', async () => {
    const handleVote = jest.fn();
    const card = { /* test data */ };

    render(<SwipeCard card={card} onVote={handleVote} />);

    const cardElement = screen.getByRole('region');
    fireEvent.mouseDown(cardElement, { clientX: 0 });
    fireEvent.mouseMove(cardElement, { clientX: 150 });
    fireEvent.mouseUp(cardElement);

    expect(handleVote).toHaveBeenCalledWith('like');
  });

  it('should show results after vote', async () => {
    const card = { /* test data */ };
    render(<SwipeCard card={card} onVote={() => {}} />);

    const likeBtn = screen.getByLabelText('Like');
    fireEvent.click(likeBtn);

    await screen.findByText(/Your opinion has been counted/);
  });
});
```

### E2E Tests (Playwright / Cypress)

```typescript
test('User can vote and see results', async ({ page }) => {
  await page.goto('/');

  // Detect and interact with card
  const card = page.locator('[data-testid="swipe-card"]');
  await card.hover();

  // Click approve button (or swipe)
  const approveBtn = page.locator('button:has-text("Approve")');
  await approveBtn.click();

  // Wait for results
  await page.waitForSelector('text=Your opinion has been counted');
  await page.waitForSelector('text=Swipe or tap for the next leader');
});
```

## Performance Optimization

### Image Optimization

```typescript
// Use next/image (if using Next.js)
import Image from 'next/image';

<Image
  src={card.avatarUrl}
  alt={card.leaderName}
  width={120}
  height={120}
  quality={80}
/>

// Or optimize images server-side (WebP, 120×120px, <50KB)
```

### Code Splitting

```typescript
// Lazy-load SwipeCard if not needed immediately
import dynamic from 'next/dynamic';

const SwipeCard = dynamic(() => import('@/components/SwipeCard'), {
  loading: () => <div>Loading...</div>,
});
```

### State Batching

```typescript
// Batch multiple state updates to avoid cascading renders
// Use useCallback to memoize handlers
```

## Troubleshooting

### Swipe not detecting on mobile

- Ensure `onTouchStart`, `onTouchMove`, `onTouchEnd` are wired correctly
- Check that parent elements don't have `overflow: hidden` (can prevent event bubbling)
- Test with actual device, not just browser dev tools

### Colors not displaying (OKLCH not supported)

- Use a fallback format or PostCSS plugin for older browsers
- Check browser support: all modern browsers support OKLCH (as of 2024)

### Accessibility: Screen reader doesn't announce votes

- Verify `aria-label` attributes are on all interactive elements
- Consider adding a live region for vote confirmation announcements

### Button not appearing on desktop hover

- Check that CSS `:hover` states are not being overridden
- Ensure Tailwind CSS is properly compiled

## Next Steps

1. **Integrate with your API** — Connect `/api/cards/next` and `/api/votes` endpoints
2. **Add onboarding** — Use `$impeccable shape onboarding` to design the country selection flow
3. **Build leaderboards** — Use `$impeccable shape leaderboard` for the rankings UI
4. **Test extensively** — Unit tests, E2E tests, user testing
5. **Deploy & monitor** — Track voting patterns, UX metrics, performance

## Support & Questions

Refer to:
- **`COMPONENT.md`** — Detailed component API and accessibility
- **`DESIGN.md`** — Visual system and design decisions
- **`PRODUCT.md`** — Product strategy and philosophy

---

**Happy shipping!** 🚀
