# Rate My President — Progress Tracker

Product type: web-app
Status: active
Priority: high
Last updated: 2026-07-23
Synced from: EOM/projects.json

## Milestones

| Milestone | Due | Status |
|-----------|-----|--------|
| Production deployment (HTTPS + domain) | — | pending |
| Frontend-Backend integration | — | done |
| Production readiness (Devin+Antigrav audit fixes) | 2026-07-23 | **in_progress (re-opened)** — combined 6-scan audit proved not complete; see RMP-13 |

## Workstreams / Tasks

| ID | Task | Status | Owner |
|----|------|--------|-------|
| RMP-04 | News headline allowlist ingestion (mechanical, not curated) | Not started | — |
| RMP-05 | Disclaimer + trust/safety policy | Partial | Kudzie |
| RMP-06 | Build/test pipeline + CI | Done | KudzBot |
| RMP-07 | Connect demo app to backend API (swipes/leaderboard/preferences) | Done | — |
| RMP-08 | Auth & user management (JWT, session persistence) | Not started | — |
| RMP-09 | Domain + HTTPS setup (geolocation requires HTTPS) | Done | Kudzie |
| RMP-10 | Automated tests (unit/integration/E2E) | In progress | KudzBot |
| RMP-11 | Country lock redesign (permanent lock, safety model) — RELEASE DEPENDENCY | scheduled_for_planning | pipeline-planning-agent |
| RMP-13 | **Production-readiness audit remediation (Wave A–E)** — RELEASE BLOCKER | In progress | KudzBot |
| RMP-14 | Pre-prod guardrails encoded in AGENTS.md | Done | KudzBot |
| RMP-15 | CI: run build + asset-path check + lint on PR | Not started | — |

## RMP-13 — Audit Remediation Plan (source: docs/COMBINED_AUDIT_2026-07-23.md)

**Launch-blocking (must merge before public marketing):**

### Wave A — Ship-blockers
- [ ] **P0-1** Leaderboard `GET /api/leaderboard?region=` 500 (server SQL: move region to WHERE, keep time filter in LEFT JOIN ON). + regression test.
- [ ] **P1-2** Move `refreshSwipeStatus()` into `finally` in `App.handleSwipe` (fixes multi-tab lock desync on business-rule 400).
- [ ] **A6 (P2 edge)** Harden vote UNIQUE-race: catch Postgres unique violation → clean `400 {allowed:false}` (pre-check already covers normal path).
- [ ] **P1-3 / P1-4** SwipeCard results: add `onNext` + make `handleVote` return `Promise<boolean>` (await `onSwipe` before reveal; rollback on `false`).
- [ ] **PERF P1/P2** Stop eager `preloadFlags()`; self-host or lazy-load animated flags on card visibility (removes third-party CDN dependency).
- [ ] **P1-1** Wire time-window (Today/This Week) + region pills to real API (currently `App` always fetches `window=all` client-side).
- [ ] **P1-5** Require explicit confirm of geolocated home country (no auto-advance).
- [ ] **P1-6** Remove/hide fabricated `[DEMO]` news on live site; add `[DEMO MODE]` bar label.
- [ ] **P1-7** Rewrite `APP_READINESS.md` (currently stale: claims SQLite/mock data).

### Wave B — Design-spec compliance + hygiene
- [ ] **UI #1** Avatar fallback `rx="60"` → `rx="20"` in `SwipeCard.tsx:319`.
- [ ] **UI #2** Replace 👉👈 emoji in `SwipeTutorial.tsx` with Arrow SVG icons.
- [ ] **UI #3** Delete `console.log` in `Leaderboard.demo.tsx:30`.
- [ ] **UI #5** Add Daily Prompt row to `SwipeCard` (rotating microcopy per DESIGN.md:223).
- [ ] **UI #7** Implement Streak Counter component (amber accent, Streak icon, `aria-live`).
- [ ] **P2-1** Add `rounded-avatar-list` token to demo `tailwind.config.js` (fixes square avatars).
- [ ] **Arch A10/A11/A12** Delete unused `rate-my-president-demo/src/AnimatedFlag.tsx`; remove `pr_comments.json` + empty `demo-app/`; expand `.gitignore`.

### Wave C — Security / perf / a11y (pre-launch hardening)
- [ ] **P2-3** Security headers (CSP/X-Frame/Referrer) on server + Vercel.
- [ ] **PERF P3/P5** WebP/AVIF the two PNGs + lazy-load globe; fix font loading (preconnect/preload or self-host).
- [ ] **P1-8** Tab → URL history sync.
- [ ] **P2-2 / P2-8** Remove meaningless "trend" column; fix leader-name a11y duplicate.
- [ ] **UI #10/#12/#13/#14 + PERF P7** Slow leaderboard auto-scroll + pause; actionable ErrorBoundary; global focus-visible ring; country-badge contrast; lighten disapprove-red token to AA-compliant `oklch(0.68 0.22 25)`.
- [ ] **P2-4 / P2-5 / P2-9** Drop `received` body echo; add error monitoring; server-side country lock.
- [ ] **Arch A9** Structured logging (`pino`) + strip frontend `console.*`.

### Wave D — Verify-first / polish (confirm before changing)
- [ ] **UI #6/#11/#16** Measure touch targets 320/375, onboarding progress mobile, menu CLS.
- [ ] **P3** Drop `sql.js` dep, raise Railway `healthcheckTimeout`, Nominatim UA, `CORS:*` tighten, React/@types align.
- [ ] **UI #17-20** Spacing-scale audit, hover states, loading visuals, disclaimer prominence.
- [ ] **Arch A13 + PERF P9/P10** Extract 50+ inline OKLCH tokens; JSON-LD `WebApplication`; `aria-live` on vote result.

### Wave E — Architecture debt (post-launch, non-blocking)
- [ ] **Arch A1/A2/A3 + PERF P4** Decompose `Onboarding`/`SwipeCard`/`Leaderboard`; `React.lazy` the three heavy demos.
- [ ] **Arch A4/A7/A8** Anonymous-UUID abuse controls; `/api/v1` versioning; president pagination.
- [ ] **Arch A15+** Backend TS + Zod validation (optional, long-term).

## Notes
React+Vite+TS frontend + Express5/Postgres backend. Combined audit (2026-07-23) consolidated 6 scans: 1 P0 (leaderboard region 500), 8 P1, plus design-spec violations, third-party flag-CDN dependency, architecture/perf debt. Antigrav "Railway crash" + "TS 6.0" claims excluded as false positives. Not launch-ready until Wave A + B merge and CHECKLIST pre-deploy items ticked.

## Changelog
- 2026-07-23 — Combined 6-scan audit added (docs/COMBINED_AUDIT_2026-07-23.md); RMP-13 reopened as audit-remediation tracker; readiness milestone re-opened `in_progress`.
