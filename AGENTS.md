# Rate My President — AI Agent Guide

## Project snapshot
- This workspace currently contains product and design documentation only.
- Key files:
  - `rate-my-president-prd.md` — product requirements, core mechanics, data model, trust/safety policy.
  - `rate-my-president-design-theory.md` — visual system, motion tone, and interaction guidance.
- No source code, build scripts, or tests were detected in the workspace at the time of writing.

## Agent behavior
- Use the PRD and design theory docs as the authoritative source for feature decisions.
- Do not assume an existing implementation or default tech stack.
- Ask the user before generating any scaffolding, code, or architecture not supported by the current workspace.
- Keep suggested changes aligned with the product constraints and UX rules in the docs.

## Important product constraints
- One swipe per user per day. The daily vote is locked server-side and skip consumes the swipe.
- The app is a gamified sentiment tracker, not a debate platform, pollster, or betting product.
- UI tone is split:
  - playful interaction, gestures, voice, reveal motion
  - serious data presentation, clean typography, consistent leaderboard templates
- Leaderboards should be ranked using an adjusted confidence score (Wilson score or equivalent), not naive percentage.
- News headlines should be pulled mechanically from an approved source allowlist, not manually curated.
- Use anonymized local UUIDs for swipe tracking; avoid device fingerprinting.
- Include an in-app disclaimer: "Entertainment product. Reflects activity of app users only — not a scientific or representative poll."

## When you see user requests in this workspace
- If the request asks for features, map them back to the PRD sections rather than inventing new product rules.
- If the request asks for design or UI, follow the split register guidance in `rate-my-president-design-theory.md`.
- If the request asks for implementation details, clarify the target platform first and confirm whether the user wants a new codebase.

## Useful reference links
- [Product Requirements](rate-my-president-prd.md)
- [Design Theory](rate-my-president-design-theory.md)
- [PRODUCT.md](PRODUCT.md) — Strategic framework (register, users, brand personality, design principles)
- [DESIGN.md](DESIGN.md) — Visual system (colors, typography, components, motion, a11y)

## Design Context (Quick Reference)

**Register:** Product app (swipe interface + leaderboards are the core experience).

**Brand Personality:** Playful (gesture, voice, reveal moment) + credible (data, leaderboards, disclaimer). Never blended—each fully committed on every screen.

**Color System (OKLCH):**
- **Base:** Navy ink `oklch(0.15 0.04 250)` for dark-mode credibility
- **Data accents:** Green `oklch(0.62 0.18 142)` for approve, Red `oklch(0.55 0.20 25)` for disapprove
- **Tertiary:** Amber `oklch(0.72 0.15 65)` for streaks and non-vote UI
- **Neutrals:** Surface-dark, muted, text-primary, text-secondary (all defined in DESIGN.md)

**Typography:**
- **Data face:** Inter (geometric, tabular figures, 400–700 weights) for all approval %, counts, stats
- **Voice face:** Space Grotesk (geometric + warmth, 400–700 weights) for headlines, empty states, copy
- Both are free/open-source variable fonts; pair cleanly without visual clash

**Motion:**
- **Swipe gesture:** Smooth & bouncy, 300–350ms drag + elastic overshoot (ease-out-quart)
- **Reveal moment:** 600ms count-up + 250ms card flip, both ease-out
- **Everything else:** Fast and quiet (leaderboard scroll smooth, instant modals)
- **All motion respects `prefers-reduced-motion: reduce`** with instant/fade alternatives

**Five Strategic Principles:**
1. Split register lives on every screen (playfulness + seriousness sit side-by-side)
2. One swipe, one leader, once per day is the mechanic that drives habit
3. Leaderboards are democratic and mechanical (Wilson score, never curated)
4. Data always outranks decoration (motion/color serve the numbers, never compete)
5. The moment after the swipe is the habit lever (10-second reveal window is retention driver)

**Accessibility:** WCAG 2.1 AA minimum. Color + text for every affordance. Semantic HTML. All motion has reduced-motion alt. Avatar readability at small sizes. Disclaimer always visible.

**Component System:** Swipe card (central), card-flip reveal, leaderboard (semantic table), share card (PNG/SVG export), disclaimer (sticky footer), streak counter, tip jar (aspirational).

## Suggested next customization
- Add a dedicated skill for translating PRD sections into feature tickets or component stories.
