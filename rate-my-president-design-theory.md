# Rate My President — Design Theory

**Status:** Design direction, pre-mockup
**Last updated:** 2026-07-06

---

## 1. The Core Tension

The product is a Tinder-style meme mechanic wrapped around real political sentiment data. If the design leans too far playful, the leaderboard numbers read as a joke and undercut the "ambient global sentiment tracker" half of the pitch. If it leans too far serious, the daily swipe loses the low-friction, funny, habitual feel that makes people open the app on day two.

**Design principle:** the seriousness lives in the data layer. The playfulness lives in the interaction and voice layer. These are never blended into one "in-between" tone — they're two distinct registers that sit next to each other on the same screen, each fully committed.

This is the same trick prediction markets like Polymarket have landed on: the subject matter can be volatile or even absurd, but numbers, percentages, and rankings are treated with fintech-grade visual seriousness. That's what lets a screenshot of the leaderboard get taken seriously if it ends up in a news article, while the swipe itself stays light.

Reference: [Polymarket](https://polymarket.com/), [PolyMarket UI Design (Dribbble)](https://dribbble.com/shots/25766084-PolyMarket-UI-Design)

---

## 2. Where Playful Lives

- Swipe physics and gestures — satisfying drag, a bit of overshoot/bounce, the "rage swipe" press-and-hold
- Micro-copy and empty states ("no recent qualifying coverage" can still have a voice)
- The card-flip reveal moment — a small flourish, not a fireworks show
- Tip jar / support language
- Streak counter framing

## 3. Where Serious Lives

- All approval percentages, trend arrows, Wilson scores, and raw counts — clean, fixed, high-contrast typography, never playful iconography touching a number
- The in-app disclaimer ("Entertainment product. Not a scientific poll.") — visible and legible, not hidden in a footer, not styled to look like a joke
- Leaderboard structure and ranking presentation — identical template regardless of who's on top or bottom (per PRD Section 8)
- Avatar treatment — consistent style and proportion across every leader, no exaggeration that reads as mean-spirited toward any one figure

---

## 4. Visual System

### Color
- **Base:** dark mode, deep ink/navy rather than pure black. Darkness is the credibility signal — it's what fintech and data products (Robinhood, Polymarket, Bloomberg) use to say "this is a real number," even when the subject matter is playful.
- **Accent pair:** one confident, slightly desaturated green for Approve, one confident red for Disapprove. Not neon, not pastel — enough saturation to feel decisive on a swipe, not enough to feel like a toy.
- **Neutral accent:** a single additional color (amber/gold works well) reserved for streaks, tip jar, and non-vote UI — keeps Approve/Disapprove meaning unambiguous everywhere else.

### Typography
- **Data typeface:** geometric, tabular-figure-friendly sans (e.g., something in the Inter / Söhne / IBM Plex family) for every number on screen — approval %, trend arrows, Wilson scores, streak counts. Numbers should look like they came out of a stats product.
- **Voice typeface:** can be the same family at a different weight, or a slightly warmer secondary face for headlines, captions, and empty-state copy. The point isn't a second font necessarily — it's that copy is allowed a looser, funnier register than numbers ever are.

### Illustration (Avatars)
- Flat vector caricature, consistent line weight, consistent proportions and canvas size across every leader — this is a system, not individual artistic takes per person.
- Exaggerate one or two recognizable features per figure, lightly — enough to be identifiable and a little funny, never grotesque.
- No photos, ever (likeness/publicity risk, per PRD Section 8).
- Because this is a real-world political figure app, avatar development should be tested first against **generic, non-identifiable placeholder figures** (an archetypal "head of state" silhouette) to lock the style system before any specific real leader is illustrated — this keeps the visual-style decision separate from any single person's likeness.

### Motion
- Swipe: fast, physical, slightly elastic — this is the one moment allowed to feel like a game.
- Reveal: brief, celebratory but not over-the-top — a stat counting up, not confetti.
- Everything else (leaderboard scroll, tab switches, admin console): fast and quiet. Motion should never compete with the data for attention outside the swipe/reveal moment.

---

## 5. Screen-Level Application

| Screen | Register |
|---|---|
| Swipe card | Mostly playful — avatar, gesture, minimal chrome |
| Card-flip reveal | Split — playful flourish on reveal, serious typography on the stats it reveals |
| Leaderboard (Day/Week/Lowest/Region) | Mostly serious — data-forward, identical treatment regardless of rank |
| Share card image | Playful frame, serious numbers inside it — this is the artifact that leaves the app, so it needs to hold up out of context |
| Disclaimer | Serious, visible, never buried |
| Tip jar | Playful, low-pressure, no dark patterns |
| Admin console | Neither — functional only, doesn't need the design system applied with any polish at v1 |

---

## 6. What This Doesn't Mean

- Not "half the app looks like Duolingo, half looks like Bloomberg" — the split happens *within* every screen, not screen-to-screen.
- Not rainbow/multi-color playful — one accent pair carries almost all of the "fun," everything else stays disciplined.
- Not photorealistic satire — the caricature style should read as affectionate ribbing, not attack-ad energy, regardless of which leader is on screen.
