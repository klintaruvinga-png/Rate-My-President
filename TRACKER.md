# Rate My President — Progress Tracker

Product type: web-app
Status: active
Priority: high
Last updated: 2026-07-22
Synced from: EOM/projects.json

## Milestones

| Milestone | Due | Status |
|-----------|-----|--------|
| Production deployment (HTTPS + domain) | — | pending |
| Frontend-Backend integration | — | done |

## Workstreams / Tasks

| ID | Task | Status | Owner |
|----|------|--------|-------|
| RMP-04 | News headline allowlist ingestion (mechanical, not curated) | Not started | — |
| RMP-05 | Disclaimer + trust/safety policy | Partial | Kudzie |
| RMP-06 | Build/test pipeline + CI | Done | KudzBot |
| RMP-07 | Connect demo app to backend API (swipes/leaderboard/preferences) | In progress | Kudzie |
| RMP-08 | Auth & user management (JWT, session persistence) | Not started | — |
| RMP-09 | Domain + HTTPS setup (geolocation requires HTTPS) | Done | Kudzie |
| RMP-10 | Automated tests (unit/integration/E2E) | In progress | KudzBot |
| RMP-11 | Country lock redesign (permanent lock, safety model) — RELEASE DEPENDENCY | scheduled_for_planning | pipeline-planning-agent |

## Notes

React+Vite+TS frontend + Express5/Postgres backend (Railway managed Postgres, `DATABASE_URL`). Persistence survives redeploys. RMP-07 in progress: demo wired to backend API (real presidents→swipe cards, server lock, registerUser, preferences→2/day limit). Pending: RMP-12 atomic swipe-limit fix (authored in autoclosed PR #38, deferred to later PR).

## Changelog
- 2026-07-22 — Synced from EOM/projects.json by sync_trackers.py
- 2026-07-22 — RMP-07 progress: wired demo to backend (getPresidents→real cards, getSwipeStatus→lock, registerUser, updatePreferences→2/day limit); fixed SwipeCardDemo→SwipeCard.demo import case (would break Vercel build). Build green. RMP-12 atomic swipe fix still deferred.
