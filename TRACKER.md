# Rate My President — Progress Tracker

Product type: web-app
Status: active
Priority: high
Last updated: 2026-07-19
Synced from: EOM/projects.json

## Milestones

| Milestone | Due | Status |
|-----------|-----|--------|
| Frontend-Backend integration | — | blocked |
| Production deployment (HTTPS + domain) | — | pending |

## Workstreams / Tasks

| ID | Task | Status | Owner |
|----|------|--------|-------|
| RMP-01 | Core swipe mechanic + server-side daily lock | In progress | Kudzie |
| RMP-02 | Leaderboard (Wilson-score ranking) | In progress | Kudzie |
| RMP-03 | Onboarding flow | In progress | Kudzie |
| RMP-04 | News headline allowlist ingestion (mechanical, not curated) | Not started | — |
| RMP-05 | Disclaimer + trust/safety policy | Partial | Kudzie |
| RMP-06 | Build/test pipeline + CI | Missing | — |
| RMP-07 | Connect demo app to backend API (swipes/leaderboard/preferences) | Not started | — |
| RMP-08 | Auth & user management (JWT, session persistence) | Not started | — |
| RMP-09 | Domain + HTTPS setup (geolocation requires HTTPS) | Pending | Kudzie |
| RMP-10 | Automated tests (unit/integration/E2E) | Not started | — |

## Blockers / Risks

- RMP-07 (blocked by RMP-09 HTTPS) (high)
- RMP-06 (no test scaffolding) (med)

## Notes

React+Vite+TS frontend + Express5/sql.js backend. Integration testing blocked until HTTPS (RMP-09) is complete and RMP-07 wires demo to API. Highest-leverage next: wire demo to API (RMP-07) after HTTPS.

## Changelog

- 2026-07-19 — Synced from EOM/projects.json by sync_trackers.py
