# Rate My President — Progress Tracker

Product type: web-app
Status: active
Priority: high
Last updated: 2026-07-20
Synced from: EOM/projects.json

## Milestones

| Milestone | Due | Status |
|-----------|-----|--------|
| Frontend-Backend integration | — | in_progress |
| Production deployment (HTTPS + domain) | — | pending |

## Workstreams / Tasks

| ID | Task | Status | Owner |
|----|------|--------|-------|
| RMP-04 | News headline allowlist ingestion (mechanical, not curated) | Not started | — |
| RMP-05 | Disclaimer + trust/safety policy | Partial | Kudzie |
| RMP-06 | Build/test pipeline + CI | Missing | — |
| RMP-07 | Connect demo app to backend API (swipes/leaderboard/preferences) | In progress | — |
| RMP-08 | Auth & user management (JWT, session persistence) | Not started | — |
| RMP-09 | Domain + HTTPS setup (geolocation requires HTTPS) | Done | Kudzie |
| RMP-10 | Automated tests (unit/integration/E2E) | Not started | — |
| RMP-11 | Country lock redesign (safety model) | Planned | Kudzie |

## Planned Updates (design decisions)

### RMP-11 — Country lock is permanent, not 24h-changeable  (RELEASE DEPENDENCY)

**Status:** Planned. **Release blocker:** yes — the app must not ship the current 24h-changeable country flow; permanent lock is a trust/safety guarantee, not a nice-to-have.
**Problem:** current design lets users change home country every 24h. That is the wrong model and defeats the product's safety intent.

**Correct design:**
- Users are locked into their home country. Detected via location permission, or set manually at onboarding. No recurring "change every 24h" path.
- Re-running onboarding must NOT re-open country selection. It may only let the user **opt in or opt out of home swipes** (i.e. toggle whether their home-country leader counts toward the 2/day allowance).
- Rationale: deliberate trust/safety design. Protects users in jurisdictions with oppressive governments that retaliate against negative ratings of leadership — even in a game. A changeable country would let coercion or self-incrimination expose the user's real home. Permanent lock + minimal opt-in/opt-out preserves the safety guarantee.

**Implementation notes (for when built):**
- Home country stored once, immutable after first set (server-side enforcement, not client).
- Migrate `onboardingStorage.ts` (client-side 24h lock via localStorage: setCountryLock/isCountryLocked/clearCountryLock) and `Onboarding.tsx` (which contains the "Change" country UI path and 24h lock message) off of the client-side 24-hour lock model and onto immutable server-side country storage.
- Onboarding re-entry → render only the home-swipe opt-in/opt-out control, never the country picker.
- Remove the "change country in 24 hours" copy/UI entirely.

## Blockers / Risks

- RMP-06 (no test scaffolding) (med)

## Notes

React+Vite+TS frontend + Express5/sql.js backend. Ready for integration testing. Highest-leverage next: wire demo to API (RMP-07) after HTTPS.

## Changelog
- 2026-07-20 — Synced from EOM/projects.json by sync_trackers.py
