# Rate My President — App Readiness

**Last updated:** 2026-07-23
**Status:** Production-deployed, **not yet launch-ready** (see RMP-13 audit remediation)

## What is live today

- **Frontend:** React + Vite + TypeScript SPA, deployed to Vercel (https://ratemypresident.xyz).
- **Backend:** Express 5 + managed Postgres (Railway), `DATABASE_URL`-backed `pg` Pool. Daily swipe-lock enforced server-side.
- **Auth model:** anonymous client UUID (`rmp_user_id` in localStorage). No JWT/cookies/PII — by design (PRD).
- **API integration:** real, live endpoints (`/swipes/log`, `/swipe/status`, `/leaderboard`, `/presidents`, `/preferences`, `/user`, `/geocode`). Not mock data.
- **Seeded data:** 26 presidents across 5 regions; Wilson-score leaderboard.

## Verified working

- Happy-path swipe → vote persists (server source of truth for the daily lock).
- Leaderboard (Global / all-time) computes Wilson score correctly.
- Onboarding saves country preference + registers anonymous UUID.
- Build is clean (`tsc -b` + `vite build`); no TypeScript errors.

## Known issues (tracked in `docs/COMBINED_AUDIT_2026-07-23.md` + `TRACKER.md` RMP-13)

**Launch blockers (Wave A/B):**
- `GET /api/leaderboard?region=<X>` returned HTTP 500 (SQL `ON`-clause bug) — **fixed server-side 2026-07-23**, pending deploy.
- Time-window (Today/This Week) and region pills are client-side only — `App` always fetches `window=all`.
- Swipe results: card auto-advances before the user can read it; failed swipe strands the card (no rollback).
- `refreshSwipeStatus()` skipped on business-rule 400 (multi-tab lock desync) — **fixed via `finally` 2026-07-23**.
- Eager flag preload pulled 27 third-party-CDN WebPs on boot — **removed 2026-07-23**; flags now lazy-load per card.
- Geolocated home country auto-assigned without explicit confirm.
- `[DEMO]` news headlines shipped as "News" — ticker now labelled `[DEMO MODE]`; real allowlist feed (RMP-04) still pending.
- Design-spec violations: circular avatar fallback (→ fixed `rx=20`), emoji in SwipeTutorial (→ fixed with arrow icons), `console.log` in shipped component (→ removed), `rounded-avatar-list` token missing (→ added to demo tailwind config).
- Daily Prompt row + Streak Counter components not yet implemented (DESIGN.md gap).

**Hardening (Wave C) / debt (Wave E):** security headers, PNG→WebP + font loading, `React.lazy` code-splitting, component decomposition, OKLCH token extraction, structured logging.

## Pre-launch gate

Do **not** market publicly until Wave A + B merge and the `CHECKLIST.md` pre-deploy items are ticked green. See `TRACKER.md` RMP-13 for the full remediation plan.

## Myth-busters (corrected by audit)

- ❌ "Database: SQLite" — **false**; Postgres via Railway since PR #37.
- ❌ "Leaderboard uses mock data" — **false**; live API + seeded presidents.
- ❌ "Connect demo app to backend API" — **done** (RMP-07).
- ❌ "Auth & user management (JWT)" — **not applicable**; anonymous-UUID by design.
