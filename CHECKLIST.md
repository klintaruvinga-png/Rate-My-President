# Rate My President — Release Checklist

Use before any deploy or feature sign-off. Maps to PRD sections.
Last updated: 2026-07-23

## Product rules (non-negotiable)

- [x] Swipe limit enforced server-side: 1/day (no home country) or 2/day (home country set; 1 home leader + 1 international).
- [x] Skip consumes the daily swipe. Daily vote locked server-side.
- [x] Leaderboards use adjusted confidence score (Wilson or equivalent), not naive %.
- [ ] News headlines pulled mechanically from approved allowlist only. *(BLOCKED: live site still ships fabricated `[DEMO]` headlines — RMP-13 Wave A P1-6)*
- [x] Anonymized local UUID for swipe tracking; no device fingerprinting.
- [x] In-app disclaimer visible: "Entertainment product. Reflects activity of app users only — not a scientific or representative poll."

## UI / split-register

- [x] Playful layer (gesture, voice, reveal motion) and serious layer (data, leaderboards) both fully committed per screen — never blended.
- [x] Swipe gesture: 300–350ms drag + elastic overshoot (ease-out-quart).
- [x] Reveal: 600ms count-up + 250ms card flip (ease-out).
- [x] All motion respects `prefers-reduced-motion: reduce`.

## Accessibility (WCAG 2.1 AA)

- [x] Color + text for every affordance.
- [x] Semantic HTML for leaderboard (table).
- [x] Avatar readability at small sizes.
- [x] Disclaimer always visible.

## Pre-deploy (RMP-13 Wave A + B gate — MUST be green before public marketing)

- [ ] **P0-1** Leaderboard `GET /api/leaderboard?region=` returns 200 (no 500). Regression test added.
- [ ] **P1-1** Time-window (Today/This Week) + region pills actually query the API and update the grid.
- [ ] **P1-2** `refreshSwipeStatus()` runs in `finally` — multi-tab lock state stays correct on business-rule 400.
- [ ] **P1-3/P1-4** Failed swipe rolls back the card (no frozen results overlay); `handleVote` awaits server result.
- [ ] **PERF P1/P2** No eager third-party flag preload on boot; flags self-hosted or lazy-loaded.
- [ ] **P1-5** Geolocated home country requires explicit user confirm (no auto-advance).
- [ ] **P1-6** No fabricated `[DEMO]` headlines on the live site; ticker shows `[DEMO MODE]` when placeholder.
- [ ] **UI #1/#2/#3** Avatar fallback rounded-square (`rx=20`); no emoji in interactive UI; no `console.log` in shipped components.
- [ ] **UI #5/#7** Daily Prompt row present; Streak Counter implemented.
- [ ] **P2-1** Avatars render rounded (Tailwind `rounded-avatar-list` token present).
- [ ] Manual verification of swipe lock logged.
- [ ] Leaderboard score recalculated against known inputs.
- [ ] No real payment secrets, private codes, or live endpoints in client bundle.
- [ ] AGENTS.md updated to current (code-bearing) state.

## Open gaps

- [ ] Automated test for swipe-lock and Wilson-score logic (see TRACKER.md RMP-10).
- [ ] API client retry/backoff on transient fetch failure (low priority).
- [ ] Country lock redesign (RMP-11) — permanent lock safety model.
