# Leaderboard Integration Guide

## Quick Start

You have three files ready for integration:

1. **`Leaderboard.tsx`** — Main component (production-ready)
2. **`Leaderboard.types.ts`** — TypeScript interfaces
3. **`Leaderboard.demo.tsx`** — Example usage & demo
4. **`LEADERBOARD.md`** — Complete documentation

## Setup Steps

### 1. Copy Component Files

```
src/
  components/
    Leaderboard/
      Leaderboard.tsx
      Leaderboard.types.ts
      Leaderboard.demo.tsx
      index.ts (optional)
```

Create `src/components/Leaderboard/index.ts`:

```typescript
export { default as Leaderboard } from './Leaderboard';
export * from './Leaderboard.types';
```

### 2. Create Leaderboard Page/Route

**Option A: Next.js (App Router)**

```typescript
// app/leaderboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Leaderboard from '@/components/Leaderboard';
import { LeaderboardEntry } from '@/components/Leaderboard/Leaderboard.types';

export default function LeaderboardPage() {
  const [window, setWindow] = useState<'day' | 'week' | 'all'>('day');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    fetchLeaderboard(window);
  }, [window]);

  const fetchLeaderboard = async (timeWindow: typeof window) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leaderboard?window=${timeWindow}`);
      if (!response.ok) {
        throw new Error('Failed to load rankings');
      }

      const data = await response.json();
      setEntries(data);

      // Format last updated timestamp
      const now = new Date();
      setLastUpdated(`${now.toLocaleTimeString()}`);
    } catch (err) {
      setError('Unable to load rankings. Try refreshing.');
      console.error('Leaderboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaderClick = (leaderId: string) => {
    // Navigate to leader detail page or open modal
    console.log('Clicked leader:', leaderId);
    // Example: router.push(`/leaders/${leaderId}`);
  };

  return (
    <main className="min-h-screen bg-[oklch(0.15_0.04_250)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-['Space_Grotesk'] text-[oklch(0.95_0.02_250)] mb-2">
            Global Rankings
          </h1>
          <p className="text-[oklch(0.75_0.02_250)] font-['Space_Grotesk']">
            See how your swipe impacts worldwide consensus.
          </p>
        </div>

        <Leaderboard
          entries={entries}
          isLoading={isLoading}
          error={error}
          selectedWindow={window}
          onWindowChange={setWindow}
          onLeaderClick={handleLeaderClick}
          lastUpdated={lastUpdated}
        />
      </div>
    </main>
  );
}
```

**Option B: React Router**

```typescript
// pages/Leaderboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Leaderboard from '@/components/Leaderboard';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [window, setWindow] = useState<'day' | 'week' | 'all'>('day');
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard(window);
  }, [window]);

  const fetchLeaderboard = async (timeWindow: typeof window) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leaderboard?window=${timeWindow}`);
      if (!response.ok) throw new Error('Failed to load');

      const data = await response.json();
      setEntries(data);
    } catch (err) {
      setError('Unable to load rankings. Try refreshing.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaderClick = (leaderId: string) => {
    navigate(`/leaders/${leaderId}`);
  };

  return (
    <Leaderboard
      entries={entries}
      isLoading={isLoading}
      error={error}
      selectedWindow={window}
      onWindowChange={setWindow}
      onLeaderClick={handleLeaderClick}
    />
  );
}
```

### 3. Create Backend Endpoint

**Express.js Example:**

```typescript
// routes/leaderboard.ts
import express from 'express';
import { getLeaderboardData } from '../services/leaderboard';

const router = express.Router();

router.get('/leaderboard', async (req, res) => {
  const { window = 'day' } = req.query;

  if (!['day', 'week', 'all'].includes(window as string)) {
    return res.status(400).json({ error: 'Invalid window' });
  }

  try {
    // Fetch from database
    const entries = await getLeaderboardData(window as 'day' | 'week' | 'all');

    // Transform to API format
    const response = entries.map((entry) => ({
      id: entry.leaderId,
      rank: entry.rank,
      name: entry.name,
      avatarUrl: entry.avatarUrl,
      approvalPercent: Math.round(entry.approvalPercent),
      trend: calculateTrend(entry),
      voteCount: entry.voteCount,
      updatedAt: entry.updatedAt,
    }));

    res.json(response);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to load rankings' });
  }
});

function calculateTrend(entry: any): 'up' | 'down' {
  // Compare current approval % to previous period
  return entry.approvalPercent >= entry.previousApprovalPercent ? 'up' : 'down';
}

export default router;
```

### 4. Add to Navigation/Layout

```typescript
// components/Nav.tsx
import Link from 'next/link';

export function Nav() {
  return (
    <nav className="flex gap-4">
      <Link href="/app">Swipe</Link>
      <Link href="/leaderboard">Rankings</Link>
      <Link href="/profile">Profile</Link>
    </nav>
  );
}
```

### 5. Optional: Real-time Updates with WebSocket

For real-time row updates without page refresh:

```typescript
// hooks/useLeaderboardStream.ts
import { useEffect } from 'react';
import { LeaderboardEntry } from '@/components/Leaderboard/Leaderboard.types';

export function useLeaderboardStream(
  window: 'day' | 'week' | 'all',
  onUpdate: (entry: Partial<LeaderboardEntry>) => void
) {
  useEffect(() => {
    const ws = new WebSocket(
      `wss://${window.location.host}/api/leaderboard/stream?window=${window}`
    );

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      onUpdate(update);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => ws.close();
  }, [window, onUpdate]);
}
```

Usage in your page:

```typescript
const handleUpdate = (update: Partial<LeaderboardEntry>) => {
  setEntries((prev) =>
    prev.map((entry) =>
      entry.id === update.id ? { ...entry, ...update } : entry
    )
  );
};

useLeaderboardStream(window, handleUpdate);
```

## Data Flow

```
LeaderboardPage
  ↓
  useEffect triggers on window change
  ↓
  Fetch /api/leaderboard?window={day|week|all}
  ↓
  Backend queries database (Wilson score ranking)
  ↓
  Returns sorted LeaderboardEntry array
  ↓
  Component renders table with entries
  ↓
  User clicks column header or tab
  ↓
  State updates → new API request
```

## State Management Pattern

**Option A: Component state (simple)**

```typescript
const [window, setWindow] = useState<'day' | 'week' | 'all'>('day');
const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

// On window change:
setWindow('week'); // triggers useEffect → fetch
```

**Option B: Context + localStorage (medium)**

```typescript
const LeaderboardContext = createContext<{
  window: 'day' | 'week' | 'all';
  setWindow: (w: typeof window) => void;
}>({ window: 'day', setWindow: () => {} });

export function LeaderboardProvider({ children }) {
  const [window, setWindow] = useState<'day' | 'week' | 'all'>(() => {
    return (localStorage.getItem('leaderboard_window') as any) || 'day';
  });

  const handleSetWindow = (w: typeof window) => {
    setWindow(w);
    localStorage.setItem('leaderboard_window', w);
  };

  return (
    <LeaderboardContext.Provider value={{ window, setWindow: handleSetWindow }}>
      {children}
    </LeaderboardContext.Provider>
  );
}
```

**Option C: Redux/Zustand (enterprise)**

```typescript
// store/leaderboardSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchLeaderboard = createAsyncThunk(
  'leaderboard/fetch',
  async (window: 'day' | 'week' | 'all') => {
    const response = await fetch(`/api/leaderboard?window=${window}`);
    return response.json();
  }
);

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState: {
    entries: [],
    window: 'day',
    isLoading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.entries = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.error = action.error.message;
        state.isLoading = false;
      });
  },
});

export default leaderboardSlice.reducer;
```

## Testing

### Unit Tests (React Testing Library)

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Leaderboard from '@/components/Leaderboard';
import { LeaderboardEntry } from '@/components/Leaderboard/Leaderboard.types';

const mockEntries: LeaderboardEntry[] = [
  {
    id: '1',
    rank: 1,
    name: 'Leader A',
    avatarUrl: '/avatar-a.svg',
    approvalPercent: 68,
    trend: 'up',
    voteCount: 12450,
  },
  {
    id: '2',
    rank: 2,
    name: 'Leader B',
    avatarUrl: '/avatar-b.svg',
    approvalPercent: 54,
    trend: 'down',
    voteCount: 11230,
  },
];

describe('Leaderboard Integration', () => {
  it('displays leaders in correct order', () => {
    render(
      <Leaderboard entries={mockEntries} selectedWindow="day" />
    );

    const names = screen.getAllByRole('cell').filter((cell) =>
      cell.textContent?.includes('Leader')
    );

    expect(names[0]).toHaveTextContent('Leader A');
    expect(names[1]).toHaveTextContent('Leader B');
  });

  it('fetches new data when window changes', async () => {
    const handleWindowChange = jest.fn();

    render(
      <Leaderboard
        entries={mockEntries}
        selectedWindow="day"
        onWindowChange={handleWindowChange}
      />
    );

    const weekTab = screen.getByText('This Week');
    fireEvent.click(weekTab);

    expect(handleWindowChange).toHaveBeenCalledWith('week');
  });

  it('sorts by approval % when column is clicked', async () => {
    render(
      <Leaderboard entries={mockEntries} selectedWindow="day" />
    );

    const approvalHeader = screen.getByText('Approval');
    fireEvent.click(approvalHeader);

    // Verify sort indicator
    expect(approvalHeader.parentElement).toHaveTextContent('▼');
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('leaderboard loads and displays rankings', async ({ page }) => {
  await page.goto('/leaderboard');

  // Wait for table to load
  await page.waitForSelector('table');

  // Verify table has rows
  const rows = await page.locator('tbody tr');
  expect(await rows.count()).toBeGreaterThan(0);

  // Verify first row has rank 1
  await expect(page.locator('tbody tr').first()).toContainText('#1');
});

test('user can switch between time windows', async ({ page }) => {
  await page.goto('/leaderboard');

  // Initially on "Today"
  const todayTab = page.locator('button:has-text("Today")');
  await expect(todayTab).toHaveAttribute('aria-selected', 'true');

  // Click "This Week"
  await page.locator('button:has-text("This Week")').click();

  // Table should update
  await page.waitForTimeout(500);
  const rows = await page.locator('tbody tr');
  expect(await rows.count()).toBeGreaterThan(0);
});

test('user can sort by column', async ({ page }) => {
  await page.goto('/leaderboard');

  // Click Approval column
  await page.locator('text=Approval').click();

  // Sort indicator should appear
  await expect(page.locator('text=Approval')).toContainText('▼');
});
```

## Performance Optimization

### Memoization

```typescript
// Prevent unnecessary re-renders of Leaderboard rows
const Leaderboard = React.memo(function Leaderboard(props: LeaderboardProps) {
  return ( /* ... */ );
});
```

### Virtual Scrolling (Large Lists)

For 500+ entries, use `react-virtual` or similar:

```typescript
import { FixedSizeList } from 'react-window';

const VirtualLeaderboard = ({ entries }: { entries: LeaderboardEntry[] }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={entries.length}
      itemSize={56}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {/* Render row */}
        </div>
      )}
    </FixedSizeList>
  );
};
```

### Caching

```typescript
// Cache leaderboard data per window
const leaderboardCache = new Map<'day' | 'week' | 'all', LeaderboardEntry[]>();

const fetchLeaderboard = async (window: 'day' | 'week' | 'all') => {
  if (leaderboardCache.has(window)) {
    return leaderboardCache.get(window);
  }

  const response = await fetch(`/api/leaderboard?window=${window}`);
  const data = await response.json();
  leaderboardCache.set(window, data);
  return data;
};
```

## Troubleshooting

### Table not displaying data

- Check that `entries` prop is not empty
- Verify API endpoint returns correct format
- Check browser console for errors

### Sorting not working

- Ensure `LeaderboardEntry` has correct data types (approvalPercent as number, voteCount as number)
- Verify sort state updates when column header is clicked

### Real-time updates not showing

- Check WebSocket connection (browser DevTools → Network)
- Verify server is broadcasting updates
- Check that row keys match entry IDs (React reconciliation)

### Mobile responsive issues

- Test on actual mobile device (not just browser resize)
- Check that CSS media queries are working
- Verify Tailwind breakpoints are configured correctly

---

**Ready to integrate!** 🚀

See LEADERBOARD.md for complete API documentation.
