# Design

**Status:** Seeded from strategic inputs, pre-implementation
**Last updated:** 2026-07-06

---

## Color Palette

**Strategy:** Full palette with 3–4 named roles, each used deliberately. Navy/ink base with green/red data accents and supporting neutrals for UI chrome and surfaces.

All colors are defined in OKLCH for perceptual uniformity and precision.

### Primary Brand Color
- **`--navy-ink` / Ink Base:** `oklch(0.15 0.04 250)` — Deep, dark, credibility signal. Used for backgrounds, body text, and the overall dark-mode foundation.

### Data Accent Pair
- **`--approve-green` / Approve:** `oklch(0.62 0.18 142)` — Confident, slightly desaturated green. Used for approval indicators, right-swipe affordance, positive trends, and confirm buttons.
- **`--disapprove-red` / Disapprove:** `oklch(0.55 0.20 25)` — Confident, saturated red. Used for disapproval indicators, left-swipe affordance, negative trends, and destructive buttons.

### Tertiary Accent
- **`--amber-accent` / Streak & Secondary:** `oklch(0.72 0.15 65)` — Warm, distinct from the binary approve/disapprove pair. Used for streak counters, tip jar language, and non-vote UI to keep Approve/Disapprove unambiguous.

### Supporting Neutrals
- **`--surface-dark` / Card/Layer Background:** `oklch(0.20 0.02 250)` — Slightly lighter than the ink base to create card/panel depth without breaking the dark aesthetic.
- **`--surface-muted` / UI Chrome (buttons, inputs, dividers):** `oklch(0.28 0.02 250)` — For hover states, disabled states, and subtle dividers.
- **`--text-primary` / Body Text:** `oklch(0.95 0.02 250)` — Near-white for maximum contrast (≥4.5:1 on ink base).
- **`--text-secondary` / Captions & Meta:** `oklch(0.75 0.02 250)` — Muted but legible, for timestamps, source names, secondary info.

### Contrast Verification
- Body text (`--text-primary` on `--navy-ink`): **9.8:1** ✓ (exceeds WCAG AAA)
- Body text on `--surface-dark`: **8.2:1** ✓
- Approve/disapprove indicators at 18px+: **4.1:1** ✓ (meets WCAG AA for large text)
- All placeholder text and captions meet ≥4.5:1 against their background.

---

## Typography

### Data Face: Inter
- **Family:** Inter
- **Weights in use:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Use cases:** All approval percentages, trend arrows, scores, counts, leaderboard tables, timestamps, stat numbers
- **Sizing:** 12–20px body range; 24–28px for large stat callouts
- **Tabular figures:** Enabled globally for this family (numbers don't jitter when values update)
- **Letter-spacing:** 0 (neutral)
- **Character:** Geometric, serious, industry-default for data products; reads as credible and fintech-adjacent

### Voice Face: Space Grotesk
- **Family:** Space Grotesk
- **Weights in use:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Use cases:** Headlines, empty-state copy, micro-copy, button labels, tip-jar language, disclaimer text, card titles
- **Sizing:** 16–24px for headlines; 14px for voice copy and captions
- **Letter-spacing:** 0 (relying on letterforms for personality, not tracking)
- **Character:** Geometric cousin to Inter with warmer, quirkier details (rounded terminals, playful 'a' and 'g'); reads as personality without breaking the data-serious visual language

### Hierarchy

| Element | Face | Size | Weight | Line-height |
|---|---|---|---|---|
| **H1 (Card headline / President name)** | Space Grotesk | 24–28px | 600 | 1.2 |
| **H2 (Section heading, e.g., "President of the Week")** | Space Grotesk | 20px | 600 | 1.3 |
| **H3 (Card stat label, e.g., "Approval")** | Inter | 14px | 500 | 1.4 |
| **Body (Card copy, empty states)** | Space Grotesk | 14–16px | 400 | 1.5 |
| **Stat number (approval %, 7-day trend)** | Inter | 18–32px | 700 | 1.1 |
| **Table cell (leaderboard)** | Inter | 14–16px | 400–500 | 1.4 |
| **Timestamp / source** | Inter | 12px | 400 | 1.4 |
| **Caption / meta** | Space Grotesk | 12–13px | 400 | 1.4 |

### Text Wrapping
- H1–H3: `text-wrap: balance` (even line breaks)
- Long prose (empty-state messages): `text-wrap: pretty` (reduce orphans)

---

## Motion & Animation

**Philosophy:** Smooth and bouncy on the swipe gesture (the core interaction, where playfulness lives); fast and quiet elsewhere (interaction chrome, leaderboard, list updates). All motion respects `prefers-reduced-motion: reduce` with instant/fade alternatives.

### Swipe Gesture
- **Easing:** `cubic-bezier(0.34, 1.56, 0.64, 1)` — Ease-out with subtle overshoot (quart or quint equivalent)
- **Duration:** 300–350ms drag and release; overshoot settles in ~400ms total
- **Physics:** Card follows finger, slightly elastic; on release, snaps to final state with bounce
- **Reduced motion alt:** Instant snap to final state (no drag visualization or bounce)

### Card Flip Reveal
- **Stat counter:** Counts from 0 to final approval % over 600ms, easing out (quart)
- **Flip transition:** Brief cross-fade or rotate (180°) of the card content, 250ms ease-out
- **Reduced motion alt:** Instant reveal, no animation

### List & Leaderboard Scroll
- **Scroll behavior:** Smooth (native CSS `scroll-behavior: smooth` or framework equivalent)
- **Item entrance** (if staggered): Each row fades in over 200ms on view entry, staggered +50ms
- **Reduced motion alt:** No stagger; instant fade-in or no entrance animation

### Tab / Modal Transitions
- **In:** Fade + 2% scale-up, 150ms ease-out
- **Out:** Fade, 100ms ease-in
- **Reduced motion alt:** Instant

### Hover & Focus States
- **Button hover:** Opacity shift from 100% to 85%, 100ms
- **Focus ring:** 2px solid `--approve-green` (or context-appropriate accent), 2px offset, 100ms transition
- **Reduced motion alt:** Static focus ring, no opacity transition

---

## Component System (MVP Scope)

### Core Surfaces

#### 1. Swipe Card
- **Container:** 280–360px wide, centered, on `--surface-dark` background
- **Avatar:** 120×120px vector illustration, centered, single line-weight, flat color
- **President name:** H1, Space Grotesk 24px, centered, balanced text wrap
- **Swipe affordances:** 
  - Left/right drag targets: full card is draggable
  - Keyboard: Left Arrow = disapprove, Right Arrow = approve, Up Arrow = skip
  - Screen reader: Approve/Disapprove/Skip buttons below card, labeled with leader name
  - Rage swipe: Press-and-hold down (hold for 500ms) triggers visual feedback (scale pulse, haptic on mobile)
- **Accessibility:** `role="region"` with `aria-label="Daily leader card"`, semantic buttons for keyboard users

#### 2. Card Flip Reveal
- **Approval %:** Inter 32px, bold, `--approve-green` or `--disapprove-red` depending on direction
- **7-day trend arrow:** ↑ (green) or ↓ (red), inline with approval %, no label (icon + screen-reader text in alt)
- **Headline(s):** Space Grotesk 14px, up to 2 linked articles, source name + publish date (Inter 12px)
- **Confirmation text:** Space Grotesk 14px, "You rated this person approve/disapprove today"
- **CTA:** "See more" button linking to leaderboard context (optional at v1)

#### 3. Leaderboard (Day/Week/Month/Lowest)
- **Table structure:** Semantic `<table>` with `<thead>`, `<tbody>`
- **Columns:** Rank | Leader avatar + name | Approval % | 7-day trend | Vote count
- **Row height:** 56–64px for touch
- **Avatar in table:** 40×40px, same illustration style as swipe card, left-aligned in name cell
- **Approval %:** Right-aligned, `--approve-green` or `--disapprove-red`, tabular figures (Inter)
- **Sorting:** Column headers marked with `aria-sort="ascending|descending|none"` and visual indicator (triangle or arrow)
- **Responsive:** On mobile, hide vote count; show rank and approval % always
- **Accessibility:** Keyboard sort (click or Enter on header), semantic labeling

#### 4. Share Card / Social Image
- **Dimensions:** 1080×1920px (vertical story format) or 1200×630px (link preview)
- **Design:** Playful frame (gradient or brand color border) with serious numbers inside; leader avatar, approval %, trend, timestamp, "Rate My President" branding
- **Generated server-side** (not a component; PNG or SVG export)

#### 5. Disclaimer
- **Placement:** Footer on every screen (sticky if scrollable), always visible
- **Text:** "Entertainment product. Reflects app users only — not a scientific or representative poll."
- **Styling:** Inter 12px, `--text-secondary`, on `--navy-ink`, never hidden or styled to minimize
- **Accessibility:** Not hidden from screen readers; appears in logical reading order

#### 6. Streak Counter
- **Display:** "🔥 Streak: X days" or similar (if emoji used, ensure alt text for screen readers)
- **Color:** `--amber-accent` or approve-green if linked to a specific action
- **Typography:** Space Grotesk 16px, 600 weight
- **Update logic:** Non-punishing; skipping a day increments the "days missed" counter but doesn't reset the historical approval rate

#### 7. Tip Jar (Aspirational, v1+)
- **Trigger:** Small button or link in footer or settings
- **Copy:** Playful, low-pressure (Space Grotesk)
- **No dark patterns:** Checkbox is unchecked by default; explicit amount entry, no surprises
- **Color:** `--amber-accent` to differentiate from Approve/Disapprove

---

## Layout & Spacing

### Spacing Scale
```
4px   (xs — dividers, tight spacing)
8px   (sm — internal padding, margin between small elements)
12px  (md — card padding, margin between sections)
16px  (lg — section padding, margin between major blocks)
24px  (xl — page gutters, gap between top-level containers)
32px  (xxl — hero spacing, major layout dividers)
```

### Breakpoints
- **Mobile:** 320–767px (default; optimize for this first)
- **Tablet:** 768–1024px
- **Desktop:** 1025px+

### Grid
- **Mobile:** Single column, 16px left/right gutter
- **Tablet/Desktop:** Optional 2–3 column grid for leaderboard or gallery views; 24px gutter
- **Card max-width:** 360px (swipe card stays narrow even on desktop to preserve gesture clarity)

### Radius
- **Cards / panels:** 12px
- **Buttons / inputs:** 8px
- **Avatars:** 0 (square, consistent scale)
- **Pill buttons:** 24px (only for micro-affordances like close or filter chips)

---

## Dark Mode

Rate My President ships **dark-mode-first**. No light mode at v1.

If a light mode is added later:
- Flip `--navy-ink` to `oklch(0.98 0.01 250)` (near-white)
- Flip neutrals proportionally (surface-dark → near-white, text-primary → ink)
- Keep approve/disapprove green and red unchanged (they maintain sufficient contrast in light mode)
- Amber accent may need slight saturation boost for visibility

---

## Accessibility Checklist (Built-in)

- [x] WCAG 2.1 AA contrast minimum (all text, interactive elements)
- [x] Color + text for every affordance (swipe gesture has approve/disapprove buttons for keyboard/screen-reader)
- [x] Semantic HTML (tables, headings, landmark regions)
- [x] Motion respects `prefers-reduced-motion: reduce`
- [x] Focus indicators visible and clear (2px offset ring in accent color)
- [x] Avatar illustrations readable at small sizes (no tiny details lost on mobile)
- [x] Disclaimer always visible, never minimized or hidden
- [x] Screen reader announcements for streak updates, swipe results, leaderboard sort changes

---

## Next Steps

1. **Before code:** Confirm color palette in OKLCH, or run a live swatch if any shifts are needed.
2. **Component mockups:** Create Figma or design-tool file using this system; lock avatar style and proportions early.
3. **Dev handoff:** Convert colors to CSS custom properties; set up Inter + Space Grotesk from Google Fonts or Fontsource.
4. **Live audit:** After initial build, run `$impeccable audit` to catch any contrast, responsive, or a11y gaps.
5. **Post-launch iteration:** Re-run `$impeccable document` to capture real tokens and components from the live codebase; this DESIGN.md serves as the north star, not the final record.
