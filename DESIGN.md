# Design

**Status:** Comprehensive system (v1 base + v2 addendum fully integrated)
**Last updated:** 2026-07-07
**Note:** This document supersedes DESIGN-v2-addendum.md. All content is consolidated here; where v2 addendum conflicted with v1, v2 rulings are authoritative.

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

## Illustration System (Presidential Portraits)

**Binding rules:** Portraits are the single most visible element on the card. They must consistently signal "editorial credibility" across all leaders, all ranks, all current events.

### Style: Editorial Illustration

All portraits are **flat-vector editorial illustrations**, not caricatures and not photorealistic.

**Characteristics:**
- Geometric construction, soft rounded corners, no gradients, textures, or photographic effects
- Minimal facial detail: identity is carried by hair shape/color, facial hair, glasses (if applicable), face shape, eyebrows, and skin tone—**never** by wrinkle exaggeration, pores, or proportion distortion
- Recognition target: readable in under 1 second at 40×40px (leaderboard size)
- **NO:** caricature-level exaggeration, distorted proportions, comic-book styling, realistic rendering, AI-photo look, painterly effects

### Canvas: Rounded-Square Bust Format

**Ruling:** Every portrait includes head, neck, and upper shoulders on a rounded-square canvas, **not circular**. Circular crops disrupt the shoulder composition and fail at small sizes.

| Context | Size | Corner Radius | Usage |
|---|---|---|---|
| Swipe Card (hero) | 120 × 120px | 20px | Main daily interaction |
| Leaderboard row | 40 × 40px | 8px | List context |
| Profile / detail | 64 × 64px | 12px | Single leader page |
| Share / social card | 160 × 160px | 24px | External sharing |

Radius scales to ~16–17% of edge length, maintaining consistent soft-square silhouette at all sizes. Master artwork is authored once per leader in SVG on a square canvas; all four sizes are the same asset rendered at different scales.

### Color Constraints (Binding)

Portraits **never** use the app's semantic vote colors. This is the single most important rule; violating it appears to editorialized.

**Banned in illustrations:** `--approve-green`, `--disapprove-red`, `--amber-accent`, any national flag colors.

**Permitted palette:** Navy, slate, neutral greys, white, natural skin-tone range (brown, tan, peach, cream), muted (desaturated) clothing colors. Suits and formal wear must read as "generic formal," not tied to any political party or national symbol.

### Background

Portraits render on `--surface-dark` in every context. Never transparent, never white, never photographic or textured background. This ensures every leader—regardless of rank, country, or current events—sits on identical visual ground, maintaining the "no editorial bias" trust principle.

### Fallback State

If a leader record has no illustration yet (new or short-notice addition), display a neutral silhouette placeholder in the same rounded-square canvas: `--surface-muted` fill, no initials, no photo, no text. Never leave the slot blank.

---

## Icon System

**Binding rule:** All emoji in interactive UI are retired as of this specification. Icons are custom-authored flat-vector SVG, pixel-aligned, with consistent stroke weight and rounded joins.

### Construction Rules

- **Grid:** 24 × 24px, pixel-aligned
- **Stroke weight:** 2px (uniform)
- **Line joins & caps:** Rounded (softer than Lucide/Phosphor defaults)
- **Construction:** Geometric, minimal internal detail
- **Color:** Authored on transparent background, controlled via `currentColor` so state swaps require no separate assets

### Color States

| State | Color | Usage |
|---|---|---|
| Default / inactive | `--text-primary` (white) | Resting state |
| Secondary | `--text-secondary` (muted grey) | Disabled, background |
| Active / positive | `--approve-green` | Vote approved, uptrend, success |
| Danger / negative | `--disapprove-red` | Vote disapproved, downtrend, error |
| Reward | `--amber-accent` | Streak, achievements, tip jar |
| Disabled | `--text-secondary` at reduced opacity | Unavailable action |

**Core principle:** Color is state, never decoration. An icon is white/muted at rest and only takes semantic color when actively communicating a state (drag, press, vote locked).

### Required Icon Inventory (18 icons total)

**Navigation:** Home, Leaderboard, Globe, News, Profile  
**Actions:** Approve, Disapprove, Skip, Share, Search, Filter, Settings, Notifications  
**Metrics:** Trend Up, Trend Down, Approval Count, Vote Count, Streak, Badge  
**Additional:** Tip Jar, Country, Calendar, Daily Vote

All inline SVG, no icon font, no emoji fallback anywhere.

### Emoji → Icon Migration Map

| Current (v1) | Replaces with (v2) | Found in |
|---|---|---|
| 👍 | Approve icon | SwipeCard buttons, results reveal |
| 👎 | Disapprove icon | SwipeCard buttons, results reveal |
| ⊘ | Skip icon | SwipeCard buttons |
| 🏠 | Home icon | SwipeCard card badge, Onboarding |
| 🌍 | Globe icon | SwipeCard card badge, Onboarding |
| 🔥 (streak) | Streak icon | Streak Counter component |
| ✓ (confirm) | Badge icon / system checkmark | Onboarding country list |

**Exception:** Unicode country flag glyphs (🇬🇧 🇫🇷 etc.) are exempt—they're factual identifiers, not decorative emoji. Where flag rendering varies by platform, pair with Country icon + text country name.

---

## Component System

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

**Layout (top to bottom):**
```
President Portrait     (120×120px, rounded-square, editorial illustration)
   ↓
President Name         (Space Grotesk, 24–28px, SemiBold, balanced wrap)
   ↓
Country                (Country icon or flag glyph + name, Inter 14px)
   ↓
Daily Prompt           (Space Grotesk, 16px, Regular—rotating microcopy)
   ↓
Swipe Area             (Gesture + Icon buttons: Approve/Disapprove/Skip)
```

**Daily Prompt examples:**
- "How's [Name] doing today?"
- "Rate today's approval"
- "Your vote counts"
- Rotates to avoid repetition; not a persistent label

**Container:** 280–360px wide, centered, on `--surface-dark` background, 12px corner radius

**Swipe affordances:**
- Left/right drag (full card is draggable): Disapprove ← | Approve →
- Keyboard: Left Arrow = disapprove, Right Arrow = approve, Up Arrow = skip
- Screen reader: Three icon buttons (Approve, Disapprove, Skip) labeled with leader name; full card region label: "Daily leader card"
- Rage swipe: Press-and-hold for 500ms triggers visual feedback (scale pulse, haptic on mobile)
- Icon usage: Approve/Disapprove/Skip icons (no emoji)

**Accessibility:** `role="region"` with `aria-label="Daily leader card"`, semantic buttons for keyboard users, pointer-capture guard to prevent scroll interference

#### 2. Card Flip Reveal

- **Approval %:** Inter 32px, bold, `--approve-green` (≥50%) or `--disapprove-red` (<50%)
- **7-day trend:** Trend Up or Trend Down icon (2px stroke, 24×24px), inline with %, no text label (icon has `aria-label` for screen readers)
- **Headlines:** Space Grotesk 14px, up to 2 linked articles, source name + publish date (Inter 12px)
- **Confirmation text:** Space Grotesk 14px, "You rated [Name] approve/disapprove today"
- **Micro-history:** "Yesterday: Approve" with Badge/confirm icon (not ✓ emoji)
- **CTA:** Optional "See more" button linking to leaderboard (secondary action)
- **Animation:** 
  - Stat counter: counts from 0 to final % over 600ms, ease-out
  - Card flip: 250ms cross-fade or 180° rotate
  - Reduced motion: instant reveal, no animation

#### 3. Leaderboard (Day/Week/Month/Lowest)

- **Table structure:** Semantic `<table>` with `<thead>`, `<tbody>`
- **Columns:** Rank | Leader (40×40px rounded-square avatar + name) | Approval % | 7-day trend (icon) | Vote count
- **Row height:** 56–64px for touch targets
- **Avatar in rows:** 40×40px rounded-square (8px radius), same illustration style as swipe card
- **Approval %:** Right-aligned, `--approve-green` or `--disapprove-red`, Inter tabular figures, bold
- **Trend icon:** Trend Up or Trend Down, 24px, inline with approval %, color-coded per state
- **Sorting:** Column headers marked with `aria-sort="ascending|descending|none"` and visual indicator (▲ or ▼)
- **Responsive:** On mobile, hide vote count; show rank and approval % always
- **Accessibility:** Keyboard sort (click or Enter on header), semantic labeling
- **Keyboard navigation:** Tab through rows, focus ring visible on each

#### 4. Share Card / Social Image

- **Dimensions:** 1080×1920px (vertical story format) or 1200×630px (link preview)
- **Design:** Playful frame (brand color or gradient border) with serious numbers; leader avatar (160×160px rounded-square), approval %, 7-day trend icon, timestamp, "Rate My President" branding
- **Generated:** Server-side (not a front-end component); export as PNG or SVG
- **Avatar alt text:** Required in metadata for accessibility

#### 5. Disclaimer

- **Placement:** Footer on every screen (sticky if scrollable), always visible
- **Text:** "Entertainment product. Reflects app users only — not a scientific or representative poll."
- **Styling:** Inter 12px, `--text-secondary` on `--navy-ink`, never hidden or de-emphasized
- **Accessibility:** Not hidden from screen readers; appears in logical reading order

#### 6. Streak Counter

- **Display:** Streak icon + "X days" text (no emoji)
- **Color:** `--amber-accent` to differentiate from vote colors
- **Typography:** Space Grotesk 16px, 600 weight
- **Update logic:** Non-punishing; skipping a day increments "days missed" but doesn't reset historical approval rate
- **Accessibility:** `aria-live="polite"` announcements on streak updates

#### 7. Tip Jar (Aspirational, v1+)

- **Trigger:** Small button or link in settings/footer
- **Copy:** Playful, low-pressure (Space Grotesk 14px)
- **Icon:** Tip Jar icon (custom SVG, 24×24px)
- **No dark patterns:** Checkbox unchecked by default, explicit amount entry
- **Color:** `--amber-accent` to differentiate from Approve/Disapprove
- **Accessibility:** Clear labeling, no surprises in copy

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

### Border Radius
- **Cards / panels:** 12px
- **Buttons / inputs:** 8px
- **Avatars:** Rounded-square per illustration specs:
  - Swipe Card: 120×120px, 20px radius
  - Leaderboard: 40×40px, 8px radius
  - Profile: 64×64px, 12px radius
  - Share card: 160×160px, 24px radius
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

- [x] WCAG 2.1 AA contrast minimum (all text ≥4.5:1, large text ≥3:1)
- [x] Color + text for every affordance (swipe gesture + keyboard buttons, icon states + labels)
- [x] Semantic HTML (`<table>`, `<thead>`, `<tbody>`, `<button>`, landmark regions)
- [x] Motion respects `prefers-reduced-motion: reduce` (instant/fade alternatives for all animations)
- [x] Focus indicators visible and clear (2px offset ring in accent color, 100ms transition)
- [x] Avatar illustrations readable at all sizes (no tiny details lost at 40×40px)
- [x] Portrait alt text: leader name and role (e.g., "President of France")
- [x] Icon aria-labels describing action, not visual (e.g., "Approve," not "thumbs up outline")
- [x] Disclaimer always visible, never minimized or hidden
- [x] Screen reader announcements for state changes (`aria-live` for streak updates, swipe results, sort changes)
- [x] Keyboard navigation: full feature parity (swipe card buttons, leaderboard sort, form controls)
- [x] Color-only states paired with text or icons (trend direction + icon, vote direction + icon)

---

## Things We Never Do (Permanent Bans)

These patterns are incompatible with Rate My President's brand and product principles:

**Visual:**
- Circular avatar crop (use rounded-square per illustration specs)
- Caricature-level facial exaggeration (use editorial illustration)
- National flag colors in leader illustrations
- Glossy, shadowy, or skeuomorphic effects on portraits
- Gradients or textures on illustration backgrounds
- Emoji in interactive UI (use custom SVG icons)
- Icon font or emoji fallback for required affordances

**Component:**
- Side-stripe borders (use full borders or background tints instead)
- Gradient text (`background-clip: text`)
- Glassmorphism as decoration
- Nested cards (one level of hierarchy only)
- Identical card grids repeated endlessly

**Interaction:**
- Decorative motion unrelated to state changes
- Orchestrated page-load sequences (no waterfall animations)
- Modal as the first choice (prefer inline or progressive alternatives)
- Dark patterns or pre-checked consent boxes

**Typography:**
- Tiny uppercase tracked eyebrows on every section (use consistent heading structure instead)
- Text overflow on headings (test at all breakpoints, reduce clamp max or rewrite copy if needed)
- Display fonts in interactive labels (Space Grotesk for voice, Inter for data only)

**Accessibility:**
- Missing alt text on illustrations
- Color as the only signal for state changes
- Focus indicators removed without replacement
- Motion that blocks content visibility

---

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

## Implementation Checklist

**Before code:**
- [ ] Author portrait illustration system: 18+ leaders in editorial style, rounded-square canvas, using only permitted colors (no flag colors, no vote semantics)
- [ ] Create neutral silhouette fallback asset (same rounded-square canvas, `--surface-muted` fill)
- [ ] Commission or generate 18-icon SVG set: Home, Leaderboard, Globe, News, Profile, Approve, Disapprove, Skip, Share, Search, Filter, Settings, Notifications, Trend Up, Trend Down, Approval, Vote, Streak, Tip Jar (all 24×24px, 2px stroke, `currentColor`-driven)
- [ ] Update `tailwind.config.js`: add avatar border-radius tokens (rounded-square: 20px, 8px, 12px, 24px per context)

**Component migrations:**
- [ ] `SwipeCard.tsx`: Add "Daily Prompt" text row; replace all emoji with icon imports; add pointer-capture guard
- [ ] `Onboarding.tsx`: Replace all emoji with icon imports; add location consent UI and geolocation gate
- [ ] `Leaderboard.tsx`: Replace trend emoji with Trend Up/Down icons; update avatar radius to 8px rounded-square; audit sort header semantics
- [ ] Streak Counter: Replace fire emoji with Streak icon; add `aria-live` for state updates
- [ ] Tip Jar: Replace any placeholder icons with Tip Jar SVG; ensure no pre-checked boxes

**Avatar updates (all components):**
- [ ] Replace `rounded-full` with `rounded-[20px]` (Swipe Card, 120×120px)
- [ ] Replace `rounded-full` with `rounded-[8px]` (Leaderboard rows, 40×40px)
- [ ] Replace `rounded-full` with `rounded-[12px]` (Profile, 64×64px)
- [ ] Replace `rounded-full` with `rounded-[24px]` (Share card, 160×160px)
- [ ] All avatar `alt` text: "[Leader Name], [Title/Country]"

**Accessibility pass:**
- [ ] Audit all icon `aria-label` attributes (describe action, not visual — e.g. “Approve” rather than “thumbs up outline”)
- [ ] Verify portrait `alt` text is present and descriptive
- [ ] Test keyboard navigation (swipe card buttons, leaderboard sort, form controls)
- [ ] Run contrast audit: ensure all text =4.5:1, all interactive elements readable at target sizes
- [ ] Test reduced-motion alternatives (motion-safe animation, motion-reduce instant reveal)
- [ ] Screen reader test: verify announcement of streak updates, vote confirmation, sort changes

**Validation:**
- [ ] Build succeeds (`npm run build`)
- [ ] No console warnings or errors
- [ ] Lighthouse audit =90 on Performance, Accessibility, Best Practices, SEO
- [ ] Component library (Storybook or similar) updated with new illustrations and icon system
- [ ] Design documentation updated if deviating from this spec

---

## Next Steps (Implementation Sequencing)

1. **Week 1 — Design assets:** Finalize portrait library (editorial style, rounded-square, color constraints). Finalize icon system (18 SVGs, 24×24px, `currentColor`).
2. **Week 2 — Component updates:** Migrate emoji to icons in SwipeCard, Onboarding, Streak Counter. Update all avatar border-radius. Add Daily Prompt row to SwipeCard layout.
3. **Week 3 — Integration & polish:** Accessibility audit, contrast verification, reduced-motion testing. Update Tailwind config, CSS tokens. Verify build and CI.
4. **Week 4 — QA & documentation:** Full end-to-end testing. Update component library. Prepare handoff notes for maintainers.

---

## Reference

- **PRODUCT.md:** Product principles, brand personality, user archetypes
- **COMPONENT.md:** Component API documentation
- **rate-my-president-prd.md:** Feature specifications and product requirements
- **rate-my-president-design-theory.md:** Strategic design framework (register split, interaction tone)
