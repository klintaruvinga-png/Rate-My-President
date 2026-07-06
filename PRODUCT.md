# Product

## Register

product

## Users

- **Casual / meme audience:** 5-second daily dopamine hit; shares leaderboard screenshots to group chats
- **Politically engaged:** Registers opinion daily, reads news links for context, checks regional trends
- **News-curious lurkers:** Browses leaderboards passively; doesn't swipe heavily but follows how leaders move
- **Global audience:** Non-US users; "world leaders" framing is core, not US-only politics

Users encounter the app during moments of low attention (between tasks, on their phone). The value is **habit formation + shareability**, not depth.

## Product Purpose

Rate My President is a daily-habit swipe app that turns lightweight political sentiment into real data. One swipe, one leader, once per day—paired with a real news headline—creates both an engaging moment and an ambient global sentiment tracker. The product's core tension is that it's built like a meme app (low-friction, playful, shareable) but functions like a live polling instrument (serious data, reproducible rankings, real news).

Success looks like: (1) users open every day for the habitual swipe; (2) leaderboard and share cards drive viral growth; (3) aggregate data becomes interesting enough to cite.

## Brand Personality

**Three words:** playful, data-driven, credible

**Voice & tone:** Casual and funny in interaction (micro-copy, empty states, gesture names like "rage swipe"), but never jokey about numbers. The swipe itself is low-pressure and meme-able; the leaderboard is fintech-serious. The product does not apologize for the playfulness OR the data seriousness—each register is fully committed, and they sit side-by-side on every screen.

**Emotional goals:** Delight in the daily ritual; confidence in the numbers; a sense of belonging to a global audience.

**Design references:**
- **Tinder:** frictionless swipe gesture, satisfying physics, minimal chrome around the core action
- **Polymarket:** dark mode + high-contrast data typography as the credibility signal; numbers treated like finance, even when the subject is absurd

## Anti-references

What this product is NOT:
- Not a debate platform (no comments, threads, arguments)
- Not a news aggregator or republisher (we link out, we don't summarize)
- Not a polling company claiming scientific rigor
- Not a real-money or betting product
- Not a partisan tool; no algorithmic bias toward any leader or region
- Not heavy-handed or preachy ("learn about politics!")
- Not trophy-like or mean-spirited in its treatment of any leader (avatars are affectionate caricature, not attack ads)

## Design Principles

1. **The split register lives on every screen, not between screens.** Playfulness (gesture, micro-copy, reveal moment) and seriousness (numbers, leaderboard, disclaimer) are two distinct tones that sit next to each other, each fully committed. Design never blends them into a watered-down in-between.

2. **One swipe, one leader, once per day is non-negotiable.** This constraint IS the product mechanic; it drives daily habit formation and prevents gaming. The constraint doesn't frustrate—it's reframed in interaction as "your daily vote" and "check back tomorrow."

3. **Leaderboards are democratic and consistent.** Every leader gets the same visual treatment regardless of rank or current events. Rankings are mechanical (Wilson score or equivalent), never curated. This builds trust and prevents platform bias accusations.

4. **Data always outranks decoration.** Motion, color, and visual flourish serve the data—they never compete with it for attention outside the swipe/reveal moment. High-contrast typography on numbers; dark mode as a seriousness signal; clean grids and no superfluous cards.

5. **The moment after the swipe is the habit lever.** The 10-second window after submission (card-flip reveal, stat counting up, or "your region just voted this way") is where tomorrow's return habit is built. This is the primary retention lever ahead of new top-level features.

## Accessibility & Inclusion

- **WCAG 2.1 Level AA minimum** for all surfaces.
- Swipe gestures must have keyboard and screen-reader equivalents (approve / disapprove buttons alongside or below the swipe card).
- Color-only affordances (the left/right swipe implying disapprove/approve) must be paired with text labels.
- All motion (card flip, stat count-up, scroll) respects `prefers-reduced-motion`; instant reveal alternatives are provided.
- Leaderboard tables are semantic HTML with proper `aria-sort`, `aria-label`, and column headers.
- Avatar caricatures are designed to be friendly and readable at small sizes; no tiny details that disappear on mobile.
- Disclaimer is always visible and never styled to look trivial.
