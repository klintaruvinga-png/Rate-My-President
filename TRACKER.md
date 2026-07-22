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
| RMP-12 | Atomic daily swipe-limit enforcement (concurrency fix) | Not started | — |

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

## Pending Fixes (identified, not yet merged)

### RMP-12 — Make daily swipe-limit enforcement atomic (Codex P1, PR #38 autoclosed)
**Status:** Not started. **Why pending:** PR #38 (which carried this fix + GOVERNANCE.md pointer) was autoclosed; deferred to a later PR per owner decision (2026-07-22).
**Problem:** `POST /api/swipes/log` checks the daily count then inserts without serialization. Two concurrent requests with different `cardType` (home/global) for the same user can both read the pre-insert count and both pass, exceeding the 1/day (no home country) or 2/day (home country) server-side cap.
**Fix (already authored, on the autoclosed branch `docs/governance-pointer`):**
- `server/src/db/client.js`: add `withTransaction(fn)` (BEGIN/COMMIT/ROLLBACK) + `run(client, sql, params)` scoped to a transaction client.
- `server/src/routes/swipes.js` `/log`: wrap check-then-insert in `withTransaction`, taking a per-user lock `pg_advisory_xact_lock(hashtext(userId)::bigint)` so all swipes for a user serialize.
**Verification:** ad-hoc pg-mem run proved the limit logic (5/5 PASS); the advisory-lock line itself is standard Postgres, untested by pg-mem, exercised at deploy. The fix must be re-opened/merged via a new PR (exclude the Dockerfile commit `241ddec` already on `main`).

## Blockers / Risks

- RMP-06 (no test scaffolding) (med)

## Notes
React+Vite+TS frontend + Express5/Postgres backend (Railway managed Postgres, `DATABASE_URL`). Persistence survives redeploys. Ready for integration testing. Highest-leverage next: wire demo to API (RMP-07) after HTTPS. Pending: RMP-12 atomic swipe-limit fix (authored, deferred to later PR).

## Changelog
- 2026-07-20 — Synced from EOM/projects.json by sync_trackers.py
- 2026-07-22 — Backend migrated sql.js→Railway Postgres (PR #37 merged, deploy live). TRACKER updated: added RMP-12 (atomic swipe-limit fix, authored in autoclosed PR #38, deferred to later PR).
