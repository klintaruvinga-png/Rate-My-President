# Leaderboard Component — Production Documentation

## Overview

`Leaderboard` is a production-ready React + TypeScript component that displays real-time leader rankings across three time windows (Day/Week/All-Time). It's designed to be lightweight, sortable, and responsive—perfect for users to check global sentiment after casting their daily swipe.

**Status:** Ready for integration into a React/Next.js app with Tailwind CSS.

## Features

- ✅ **Three time windows:** Today / This Week / All-Time
- ✅ **Real-time updates:** Rows update as votes come in (WebSocket or polling)
- ✅ **Sortable columns:** Click headers to sort by Rank, Approval %, or Vote Count
- ✅ **Responsive design:** Full table on desktop; Trend + Vote Count hidden on mobile
- ✅ **Full state coverage:** Loading skeletons, error handling, empty state
- ✅ **Accessibility:** Semantic HTML, ARIA sort attributes, keyboard navigation
- ✅ **TypeScript types:** Full type safety
- ✅ **OKLCH color system:** Integrated with Rate My President design system

## Component Props

```typescript
interface LeaderboardProps {
  /**
   * Array of leader ranking entries
   */
  entries: LeaderboardEntry[];

  /**
   * Loading state (shows skeleton loaders)
   * @default false
   */
  isLoading?: boolean;

  /**
   * Error message to display (if any)
   * @default null
   */
  error?: string | null;

  /**
   * Currently selected time window
   * @default 'day'
   */
  selectedWindow?: 'day' | 'week' | 'all';

  /**
   * Callback when user switches time window tabs
   */
  onWindowChange?: (window: 'day' | 'week' | 'all') => void;

  /**
   * Callback when user clicks a leader row
   */
  onLeaderClick?: (leaderId: string) => void;

  /**
   * Optional: Display "Updated X minutes ago"
   */
  lastUpdated?: string;
}

interface LeaderboardEntry {
  id: string;                      // Unique leader ID
  rank: number;                    // Current rank (1-based)
  name: string;                    // Leader name
  avatarUrl: string;               // 40×40px avatar illustration
  approvalPercent: number;         // 0-100
  trend: 'up' | 'down';           // 7-day trend direction
  voteCount: number;               // Total votes for this window
  updatedAt?: string;              // Last update timestamp
}
```

## Usage Example

```typescript
import Leaderboard from './Leaderboard';
import { LeaderboardEntry } from './Leaderboard.types';

function LeaderboardPage() {
  const [selectedWindow, setSelectedWindow] = useState<'day' | 'week' | 'all'>('day');
  const [isLoading, setIsLoading] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch leaderboard data when window changes
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/leaderboard?window=${selectedWindow}`);
        if (!response.ok) throw new Error('Failed to load rankings');
        
        const data = await response.json();
        setEntries(data);
      } catch (err) {
        setError('Unable to load rankings. Try refreshing.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedWindow]);

  return (
    <Leaderboard
      entries={entries}
      isLoading={isLoading}
      error={error}
      selectedWindow={selectedWindow}
      onWindowChange={setSelectedWindow}
      onLeaderClick={(leaderId) => console.log('Clicked:', leaderId)}
      lastUpdated="2 minutes ago"
    />
  );
}
```

## Screen Layout

### Desktop (≥768px)

```
┌─────────────────────────────────────────────────────────┐
│ Today | This Week | All-Time                            │
├─────────────────────────────────────────────────────────┤
│ Rank │ Leader        │ Approval │ Trend │ Votes        │
├─────────────────────────────────────────────────────────┤
│  1   │ 🇬🇧 Keir       │   68%    │  ↑   │ 12,450      │
│  2   │ 🇫🇷 Emmanuel   │   64%    │  ↑   │ 11,230      │
│  3   │ 🇪🇺 Ursula     │   58%    │  ↓   │  9,870      │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
Updated: 2 minutes ago
```

### Mobile (<768px)

```
┌────────────────────────────┐
│ Today|This Week|All-Time   │
├────────────────────────────┤
│ Rank│ Leader  │ Approval   │
├────────────────────────────┤
│  1  │ 🇬🇧 Keir │   68%     │
│  2  │ 🇫🇷 Emmanuel│ 64%    │
│  3  │ 🇪🇺 Ursula│   58%     │
│  ...                        │
└────────────────────────────┘
(Trend & Vote Count hidden)
```

## States

### Default (Data Loaded)

- Rows sorted by approval % (descending) by default
- Approval % color-coded: green ≥50%, red <50%
- Trend arrows: ↑ green or ↓ red
- Hover effect: row background highlight
- Rows animate in with staggered delays (20ms each)

### Loading

- 10 skeleton placeholder rows
- Shimmer animation on each skeleton
- Tab switcher disabled
- Same height as real rows for smooth layout shift prevention

### Error

- Clear error message displayed
- "Try Refreshing" button
- No table shown
- Last-known data can be cached and shown as fallback (optional)

### Empty

- Message: "No rankings yet. Check back after voting opens tomorrow."
- Centered in the table area
- No skeleton loaders

### Real-time Update

- When a vote arrives, affected row updates
- Cell value changes with fade-in animation (100–150ms)
- Row stays in current sort order (doesn't jump to new position)
- No full table re-sort unless user explicitly clicks column header

## Interaction Model

### Tab Switching

- **Today / This Week / All-Time** tabs above the table
- Click to switch windows
- Triggers `onWindowChange` callback
- Table data reloads (shows skeleton while loading)
- Sort state resets to default (approval % desc)

### Sorting

- **Click column header** to toggle sort direction
- Supported columns: Rank, Approval %, Vote Count
- Visual indicator: ▼ (descending) or ▲ (ascending)
- Current sort column highlighted with opacity
- Sort state persists across tabs

### Selection

- **Click a leader row** triggers `onLeaderClick` callback
- Useful for navigation to detail page or opening a modal
- Leader name has hover color change (green) for affordance

### Keyboard Navigation

- **Tab** through table rows
- **Enter** on sortable column header to toggle sort
- **Arrow keys** to navigate rows (standard table semantics)

## Design System Integration

### Colors (OKLCH)

| Element | Color | Token |
|---------|-------|-------|
| Background | `oklch(0.15 0.04 250)` | `--navy-ink` |
| Card/Row background | `oklch(0.20 0.02 250)` | `--surface-dark` |
| Text primary | `oklch(0.95 0.02 250)` | `--text-primary` |
| Text secondary | `oklch(0.75 0.02 250)` | `--text-secondary` |
| Approval % ≥50% | `oklch(0.62 0.18 142)` | `--approve-green` |
| Approval % <50% | `oklch(0.55 0.20 25)` | `--disapprove-red` |
| Dividers | `oklch(0.28 0.02 250)` | `--surface-muted` |

### Typography

| Element | Family | Size | Weight |
|---------|--------|------|--------|
| Tab labels | Space Grotesk | 14px | 600 |
| Column headers | Inter | 12–14px | 600 |
| Leader name | Space Grotesk | 14px | 600 |
| Approval % | Inter | 16px | 700 |
| Vote count | Inter | 14px | 400 |
| Error message | Space Grotesk | 14–16px | 400 |

### Motion

- **Tab transition:** Fade (150ms)
- **Row skeleton shimmer:** Continuous animated gradient
- **Row entrance:** Fade-in (200ms) staggered +20ms per row
- **Real-time update:** Cell fade (100ms) on value change
- **Hover:** Opacity transition (100ms)
- **Respects:** `prefers-reduced-motion: reduce` (no animation, instant state changes)

## Responsive Behavior

| Breakpoint | Changes |
|---|---|
| **Mobile (<768px)** | Hide Trend column, hide Vote Count column, stack tabs if needed |
| **Tablet (768–1024px)** | Show Trend, hide Vote Count, responsive padding |
| **Desktop (>1024px)** | All columns visible, standard desktop table spacing |

## Accessibility

### WCAG 2.1 AA Compliance

- ✅ Semantic `<table>` structure with `<thead>`, `<tbody>`
- ✅ Column headers with `aria-sort="ascending|descending|none"`
- ✅ Sortable columns have `cursor: pointer` and visual feedback
- ✅ Contrast: Text on background ≥4.5:1 (verified in DESIGN.md)
- ✅ Focus indicators: 2px solid outline on interactive elements
- ✅ Keyboard navigation: Tab, Enter, Arrow keys all supported
- ✅ Screen reader: Announces "Today's rankings" or equivalent

### Screen Reader Announcements

- Table label: "Leader rankings for [Today/This Week/All-Time]"
- Column headers read as "Rank, sortable", "Approval Percent, sortable", etc.
- Trend cells: Read as "up" or "down" (not just the arrow symbol)
- Vote count cells: Numbers read with comma separation ("12,450" reads as "twelve thousand four hundred fifty")

### Keyboard Shortcuts

- **Tab:** Move between sortable columns and leader rows
- **Enter:** Toggle sort on focused column header
- **Shift+Tab:** Move backward through table
- **Arrow Down:** Move to next row (when focused on a row)
- **Arrow Up:** Move to previous row
- **Arrow Right/Left:** (if row-level focus) could navigate to next leader (optional enhancement)

## API Integration

### Endpoint: `GET /api/leaderboard?window={window}`

**Parameters:**
- `window` (required): "day" | "week" | "all"

**Response:**

```json
[
  {
    "id": "leader_001",
    "rank": 1,
    "name": "Keir Starmer",
    "avatarUrl": "/avatars/keir-starmer.svg",
    "approvalPercent": 68,
    "trend": "up",
    "voteCount": 12450,
    "updatedAt": "2026-07-06T14:32:00Z"
  },
  {
    "id": "leader_002",
    "rank": 2,
    "name": "Emmanuel Macron",
    "avatarUrl": "/avatars/emmanuel-macron.svg",
    "approvalPercent": 64,
    "trend": "up",
    "voteCount": 11230,
    "updatedAt": "2026-07-06T14:32:00Z"
  }
]
```

### Real-time Updates (Optional: WebSocket)

For real-time row updates without page refresh, you can stream leaderboard changes via WebSocket:

```typescript
const ws = new WebSocket('wss://api.example.com/leaderboard/stream?window=day');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // update = { id, rank, approvalPercent, trend, voteCount }
  // Update the corresponding row in state
  setEntries((prev) =>
    prev.map((entry) =>
      entry.id === update.id ? { ...entry, ...update } : entry
    )
  );
};
```

## Testing

### Manual Testing Checklist

- [ ] **Tab switching:** Click each tab and verify data loads
- [ ] **Sorting:** Click Rank, Approval %, Vote Count headers; verify sort direction toggles
- [ ] **Responsive:** Resize browser; verify Trend hides <768px, Vote Count hides <1024px
- [ ] **Loading:** Skeleton loaders appear while data fetches
- [ ] **Error:** Click "Trigger Error" button (in demo), verify error message shows
- [ ] **Empty state:** Mock empty entries, verify "No rankings yet" message
- [ ] **Keyboard:** Tab through table, press Enter on headers, verify sort toggles
- [ ] **Screen reader:** Open in NVDA/JAWS, verify table structure and sort indicators announced
- [ ] **Hover:** Move mouse over rows, verify highlight effect
- [ ] **Click:** Click a leader name, verify `onLeaderClick` callback fires

### Unit Test Example (React Testing Library)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import Leaderboard from './Leaderboard';

describe('Leaderboard', () => {
  const mockEntries = [
    {
      id: '1',
      rank: 1,
      name: 'Leader A',
      avatarUrl: '/avatar-a.svg',
      approvalPercent: 65,
      trend: 'up' as const,
      voteCount: 1000,
    },
  ];

  it('renders leaderboard with entries', () => {
    render(
      <Leaderboard entries={mockEntries} selectedWindow="day" />
    );

    expect(screen.getByText('Leader A')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('shows loading skeletons when isLoading is true', () => {
    render(
      <Leaderboard entries={[]} isLoading selectedWindow="day" />
    );

    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays error message when error prop is set', () => {
    render(
      <Leaderboard
        entries={[]}
        error="Unable to load rankings. Try refreshing."
        selectedWindow="day"
      />
    );

    expect(screen.getByText(/Unable to load rankings/)).toBeInTheDocument();
  });

  it('calls onWindowChange when tab is clicked', () => {
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

  it('calls onLeaderClick when a leader row is clicked', () => {
    const handleLeaderClick = jest.fn();

    render(
      <Leaderboard
        entries={mockEntries}
        selectedWindow="day"
        onLeaderClick={handleLeaderClick}
      />
    );

    const leaderName = screen.getByText('Leader A');
    fireEvent.click(leaderName);

    expect(handleLeaderClick).toHaveBeenCalledWith('1');
  });
});
```

## Performance Notes

- **Component size:** ~280 lines
- **Dependencies:** React + TypeScript only (no external libraries)
- **Rendering:** Memoized sort calculations prevent unnecessary recalculates
- **Skeleton loaders:** CSS animation only (no JS animation library needed)
- **Real-time updates:** Only affected row re-renders (React key ensures proper reconciliation)
- **Mobile responsiveness:** CSS media queries; no breakpoint-specific components

## Browser Support

- Modern browsers with ES2020+ support
- CSS Grid & Flexbox support
- OKLCH color support (all modern browsers; add fallback if needed)
- Graceful degradation: works without JavaScript for initial render (semantic HTML)

## Known Limitations

1. **Sorting is client-side only.** If you have 500+ leaders, consider server-side sorting.
2. **No pagination.** For large leaderboards, add pagination or virtual scrolling.
3. **Real-time updates are optional.** Component works fine with periodic refresh or manual reload.
4. **No row details modal.** `onLeaderClick` only provides callback; modal implementation is parent's responsibility.

## Future Enhancements

- Pagination or virtual scrolling for 500+ entries
- Animated sort transitions (rows move smoothly to new positions)
- Export as CSV or image (share functionality)
- Leader detail modal (integrated or parent-handled)
- Regional leaderboard filtering (after v1)
- Historical comparison (rank changes over time)

## Changelog

**v1.0.0 (2026-07-06)** — Initial production release

- Three time windows (Day/Week/All-Time)
- Real-time row updates support
- Sortable columns (Rank, Approval %, Vote Count)
- Full state coverage (loading, error, empty)
- Responsive design (mobile, tablet, desktop)
- Accessibility support (WCAG 2.1 AA)
- TypeScript types
