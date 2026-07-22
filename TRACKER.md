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
| RMP-12 | Atomic swipe-limit fix (pg_advisory_xact_lock) — authored in autoclosed PR #38, deferred to later PR | deferred | Kudzie |
| RMP-13 | Backend pg pool hardening (retry on transient Railway-proxy drops + pool error handler) — defensive; observed write 500 was a test-harness quoting artifact, not a confirmed prod bug | done | KudzBot |
| RMP-14 | Swipe-flow hardening (Devin review): backend auto-creates user on /log (kills register/swipe FK race); frontend logSwipe type {allowed}, queue advances only on success, inline error UI | done | KudzBot |

## Notes

React+Vite+TS frontend + Express5/Postgres backend (Railway managed Postgres, `DATABASE_URL`). Persistence survives redeploys. RMP-07 in progress: demo wired to backend API (real presidents→swipe cards, server lock, registerUser, preferences→2/day limit). RMP-13 fixed: pg pool now retries transient Railway-proxy connection drops (was causing intermittent 500s on register/swipe). Pending: RMP-12 atomic swipe-limit fix (authored in autoclosed PR #38, deferred to later PR).

## Changelog
- 2026-07-22 — Synced from EOM/projects.json by sync_trackers.py
- 2026-07-22 — RMP-07 progress: wired demo to backend (getPresidents→real cards, getSwipeStatus→lock, registerUser, updatePreferences→2/day limit); fixed SwipeCardDemo→SwipeCard.demo import case (would break Vercel build). Build green. RMP-12 atomic swipe fix still deferred.
- 2026-07-22 — RMP-14: swipe-flow hardening per Devin 2nd-opinion review. Adopted the CORRECT findings; rejected the wrong premise (Devin claimed the register/swipe FK race returns 400 — our server actually returns 500, so that was not the user's 400). Backend: /api/swipes/log now auto-creates the user row (INSERT ... ON CONFLICT) before logging, killing the race (verified live: unregistered-user swipe → 200 allowed:true). Frontend: logSwipe return type {ok}→{allowed}; handleVote awaits onSwipe and advances queue ONLY on success; failed swipes keep the card + show inline error banner. Demo build green, server syntax OK. Temporary /log 400 echo logging retained until the original 400 is root-caused.
