# Rate My President — Progress Tracker

Product type: gamified sentiment tracker (swipe + leaderboards).
Status: buildable React/Vite/TypeScript implementation (`rate-my-president-demo/`) + Express 5 backend.
Last updated: 2026-07-18

## Active workstreams

| ID | Workstream | Status | Owner | Notes |
|----|-----------|--------|-------|-------|
| RMP-01 | Core swipe mechanic + server-side daily lock | In progress | Kudzie | Server enforces one home vote plus one global vote per day via `/api/swipes/log` endpoint |
| RMP-02 | Leaderboard (Wilson-score ranking) | In progress | Kudzie | Leaderboard.tsx + LEADERBOARD_*.md specs exist |
| RMP-03 | Onboarding flow | In progress | Kudzie | Onboarding.tsx + ONBOARDING_*.md specs exist |
| RMP-04 | News headline allowlist ingestion | Not started | — | Must be mechanical from approved source list, not curated |
| RMP-05 | Disclaimer + trust/safety policy | Partial | Kudzie | Disclaimer.tsx present; policy in PRD |
| RMP-06 | Build/test pipeline | Missing | — | No package.json test script; no CI |

## Blockers / risks

- No automated tests despite real code existing (SwipeCard, server). Risk: regressions on swipe-lock and leaderboard math go undetected.
- Product scope still docs-first in AGENTS.md but code now outpaces it. AGENTS.md should be updated to reflect current state.

## Definition of done (per workstream)

Each workstream is done when: code matches PRD section, manual verification logged, and (where applicable) a test covers the lock/score logic.

## Changelog

- 2026-07-18 — Tracker created. Captured RMP-01..06 from current repo state.
