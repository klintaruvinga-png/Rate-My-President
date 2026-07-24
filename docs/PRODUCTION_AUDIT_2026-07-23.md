# Rate My President — Production Readiness Audit

**Date:** 2026-07-23
**Auditor:** KudzBot (Senior Staff Eng / QA Lead)
**Repo:** `klintaruvinga-png/Rate-My-President` (branch `main`, commit `79ec1a0`)
**Prod site:** https://ratemypresident.xyz
**Prod API:** https://rate-my-president-production.up.railway.app

> Methodology: every finding below was reproduced against the live production system (curl + headless browser) and/or read directly from source. No issue is theoretical unless explicitly marked "suspected". The reported `POST /api/swipes/log` 400 is explained in Phase 3 — it is overwhelmingly the *intended* business-rule guard, not a defect. The genuinely dangerous defect is a **server-crash 500 on the leaderboard region filter**.

---

## Executive Summary

| Area | Status |
|---|---|
| Build / TypeScript | ✅ Passes clean (`tsc -b` + `vite build`) |
| Happy-path swipe | ✅ Works end-to-end |
| CORS | ✅ Works in prod (`ALLOWED_ORIGINS` is set) |
| Leaderboard (Global / all-time) | ✅ Renders |
| Leaderboard (region filter) | ❌ **HTTP 500 server crash** |
| Time-window (Today / This Week) | ❌ Non-functional — shows all-time data |
| News ticker (production) | ❌ Fabricated `[DEMO]` content shipped |
| Security headers | ❌ Missing CSP / X-Frame-Options / X-Content-Type / Referrer-Policy |
| Docs accuracy | ❌ `APP_READINESS.md` is stale/misleading |

**Overall Production Score: 62 / 100** — NOT launch-ready. One P0 crash, several P1 functional/trust blockers.

### Bug count
- **P0 (Critical):** 1
- **P1 (High):** 5
- **P2 (Medium):** 9
- **P3 (Low):** 8

---

## CRITICAL BUGS (P0)

### P0-1 — `GET /api/leaderboard?region=<X>` crashes with HTTP 500 (window=all)
- **Severity:** Critical
- **Steps to reproduce:** `curl "https://rate-my-president-production.up.railway.app/api/leaderboard?region=Europe"` (or any region, no `window`)
- **Expected behaviour:** 200 with the filtered leaderboard.
- **Actual behaviour:** `HTTP 500 {"error":"Failed to get leaderboard"}`.
- **Affected files:** `server/src/routes/leaderboard.js:40-78`
- **Root cause:** The SQL builder concatenates the region predicate directly onto the `LEFT JOIN ... ON` clause. When `window=all` produces **no** `AND sl.created_at >= ?` prefix, the ON becomes:
  ```sql
  ... ON p.id = sl.president_id p.region = $1
  ```
  (missing the `AND`). `window=day`/`week` work because they prepend `AND sl.created_at >= ?`, so the region `AND` attaches to something valid. Verified empirically: all 5 regions → 500 with `window=all`; all 5 → 200 with `window=day`; region-invalid → correct 400.
- **Recommended fix:** Keep the time filter in the `ON` clause (required for correct LEFT-JOIN semantics — non-matching presidents must still appear with 0 votes) and move the region filter into `WHERE` (it is on `p`, not `sl`, so it is safe there):
  ```js
  const sql = `
    SELECT ...
    FROM presidents p
    LEFT JOIN swipe_logs sl
      ON p.id = sl.president_id
      ${windowFilter ? 'AND sl.created_at >= ?' : ''}
    WHERE p.active = 1
      ${region ? 'AND p.region = ?' : ''}
    GROUP BY p.id ...`;
  ```
  Reparametrise `params` accordingly.
- **Effort:** ~15 min. **Risk:** Low (pure SQL-shape fix, add a regression test for `region=all`).

> Note on front-end impact: in the *deployed* build the region pills are **client-side only** (see P1-2), so clicking "Europe" silently filters the cached all-time list and never hits the 500. However any future wiring of `onRegionChange`/`onWindowChange` (the hooks exist in `Leaderboard.tsx`) or any direct API consumer will hit the crash. The server must be fixed regardless.

---

## HIGH PRIORITY (P1)

### P1-1 — Time-window selectors ("Today" / "This Week") are non-functional
- **Severity:** High
- **Steps:** Open Leaderboard → click "This Week" or "Today".
- **Expected:** data filtered to that window.
- **Actual:** data is always **all-time**. The `aria-label` even lies: `grid="Leader rankings for today"` while showing 42 all-time votes for Trump.
- **Affected files:** `rate-my-president-demo/src/App.tsx:34-60` (calls `api.getLeaderboard('all')` unconditionally), `rate-my-president-demo/src/Leaderboard.tsx` (`onWindowChange`/`onRegionChange` props declared but never passed from `App`).
- **Root cause:** `App.loadLeaderboard()` hardcodes `'all'`. The `Leaderboard` component has `selectedWindow` default `'day'` and emits `onWindowChange`, but `App` never receives/sends these values — it renders the all-time snapshot regardless of the pill.
- **Fix:** thread `selectedWindow`/`selectedRegion` state into `App`, call `api.getLeaderboard(window, region)` on change, and feed results back. Also make the `aria-label` derive from the actual window.
- **Effort:** ~1 hr. **Risk:** Low.

### P1-2 — Region filter is client-side only (API + UI out of sync)
- **Severity:** High
- **Detail:** `Leaderboard` exposes `onRegionChange`/`onRegionChange` but `App` renders `<Leaderboard entries={leaderboardEntries} />` with no handlers. Region selection filters the already-loaded `entries` array in-memory (`filteredEntries`). So the "Global / Americas / Europe / …" pills only reorder cached data; the server is never queried with `region`. Combined with P0-1, the moment anyone wires the handler the region path 500s.
- **Fix:** same as P1-1 — make region a real API parameter from `App`.
- **Effort:** included in P1-1. **Risk:** Low.

### P1-3 — Onboarding auto-assigns "home country" from IP geolocation WITHOUT user confirmation
- **Severity:** High (trust / anti-abuse / data integrity)
- **Steps:** First visit (no saved country) → reach country-select → a consent dialog appears → declining or ignoring it… geolocation still fires and `setSelectedCountry(matchedCountry)` + `setCurrentScreen('confirmation')` auto-run, pre-selecting the home leader.
- **Actual:** The home leader is chosen from IP geolocation and pushed straight to the confirmation screen with no explicit "This is your home leader — confirm?" step required.
- **Affected files:** `rate-my-president-demo/src/Onboarding.tsx:188-273` (geolocation effect auto-advances), `App.tsx:140-149` (`handleOnboardingComplete` → `updatePreferences(home_country)`).
- **Why it matters:**
  1. A user on VPN/travel/office proxy gets the *wrong* home leader, which then skews the per-country "home" vote (1 of the 2 daily votes is reserved for the home leader — a deliberate product constraint).
  2. Auto-assigning identity from IP is a trust problem for an app that frames itself as a credible sentiment tracker.
  3. Even if the user declines the consent dialog, `handleLocationConsent(false)` sets `userMadeExplicitChoice=true`, which *blocks* geolocation — but the auto-advance code path checks `userMadeExplicitChoice.current` only after a match; the consent gate is inconsistent.
- **Fix:** After geolocation resolves, **pre-select** but require an explicit "Confirm" tap (do not auto-advance to `confirmation`). Surface "We think your home country is X (from your location). Confirm or pick another." Respect a hard decline by leaving country unselected.
- **Effort:** ~2 hr. **Risk:** Medium (interaction redesign).

### P1-4 — Failed swipe strands the card in the "results" overlay (optimistic update without rollback)
- **Severity:** High (user flow)
- **Steps:** Trigger a vote whose server call fails (e.g. 500, network error, or the business-rule 400 on a race).
- **Expected:** card snaps back (or shows a clean error), queue unchanged, user can retry.
- **Actual:** The card flies away and stays stuck in the `showResults` overlay with a generic error toast, because the queue is never advanced (so `card.id` doesn't change → SwipeCard's reset effect never fires).
- **Affected files:** `rate-my-president-demo/src/SwipeCard.demo.tsx:168-208` (`handleVote` returns `true` synchronously, runs `persist` async and only `setCardsQueue(slice(1))` on success); `SwipeCard.tsx:191-241` (the `allowed === false` rollback branch is unreachable because the demo always returns `true`).
- **Root cause:** `SwipeCard.onVote` contract expects a synchronous `boolean` (false = revert). The demo returns `true` before the server result is known, so SwipeCard shows the "locked in" reveal immediately; on server rejection the demo sets `swipeError` but SwipeCard remains in results state.
- **Fix:** Make `onVote` await the server result (return the promise) OR have the demo return the resolved boolean, so SwipeCard's `allowed === false` rollback path actually executes. At minimum, on failure reset `showResults`/`voteAction` in SwipeCardDemo.
- **Effort:** ~1 hr. **Risk:** Low.

### P1-5 — Fabricated `[DEMO]` news headlines shipped on the production site
- **Severity:** High (reputational / PRD violation — pre-launch blocker)
- **Steps:** Load prod → read the News ticker under the header.
- **Actual:** Seven hardcoded `[DEMO]` headlines (e.g. "[DEMO] Trump signs executive order on trade tariff expansion").
- **Affected files:** `rate-my-president-demo/src/NewsTicker.tsx:15-23`.
- **Why it matters:** The PRD/AGENTS.md explicitly forbid fabricated or outdated political facts on a publicly-marketed product ("News/content integrity … must come from an approved allowlist endpoint, never hardcoded"). Shipping `[DEMO]` headlines under a "News" label misrepresents the product as a news source and is a trust/reputational risk.
- **Fix:** Before marketing, gate the ticker behind a real approved-allowlist endpoint, or hide it entirely (show a neutral "Live rankings update daily" strip). Never present invented political statements as news.
- **Effort:** ~1 day (real feed) or ~1 hr (hide). **Risk:** Low.

### P1-6 — `APP_READINESS.md` is stale and actively misleading
- **Severity:** High (process / handoff risk)
- **Detail:** The doc (last updated 2026-07-18) claims: "Database: SQLite", "Leaderboard: … with mock data", "Outstanding: Connect demo app to backend API endpoints", "Authentication & User Management: [ ] Implement". All three are **false** — prod uses Postgres, the UI calls the real API, and there is no JWT auth by design (anonymous UUIDs). A reviewer or new dev reading this doc will make wrong decisions (e.g. "integrate the backend" when it's already integrated).
- **Affected files:** `APP_READINESS.md` (entire doc).
- **Fix:** Rewrite to reflect current state (Postgres via Railway, real API integration live, anonymous-UUID auth model, known issues = the ones in this report).
- **Effort:** ~30 min. **Risk:** None.

---

## MEDIUM PRIORITY (P2)

### P2-1 — "Trend" column is always "up" (green) regardless of sentiment
- **Detail:** `App.tsx:43` sets `trend: (e.wilson_score ?? 0) >= 0 ? 'up' : 'down'`. Wilson score is **never negative**, so every leader — including 0%-approval, 0-vote leaders — shows a green up-arrow. The trend column is meaningless.
- **Fix:** Drop the trend column until real deltas exist, or compute trend from change vs previous window (requires historical snapshots not currently stored).
- **Affected files:** `rate-my-president-demo/src/App.tsx:43`, `Leaderboard.tsx` (trend rendering).
- **Effort:** ~30 min (or remove column). **Risk:** Low.

### P2-2 — Leaderboard avatars render as bare squares (missing `rounded-avatar-list` class)
- **Detail:** `Leaderboard.tsx:522` uses `rounded-avatar-list` (and the skeleton uses it at line 16). That token is defined only in the **repo-root** `tailwind.config.js` (`borderRadius.avatar-list`), but the demo's own `tailwind.config.js` does **not** include it, and Vite uses the demo config. Confirmed: the class is **absent from the production CSS** (`grep` on `dist` CSS → not found). Avatars therefore have no radius (square).
- **Fix:** Add the `avatar-list` radius token to `rate-my-president-demo/tailwind.config.js` (or use a literal `rounded-lg`).
- **Affected files:** `rate-my-president-demo/tailwind.config.js`, `rate-my-president-demo/src/Leaderboard.tsx:16,522`.
- **Effort:** ~10 min. **Risk:** Low.

### P2-3 — Missing security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- **Detail:** Both `ratemypresident.xyz` and the Railway API return **no** `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, or `Referrer-Policy`. (HSTS is present on Vercel.) No `helmet` on the Express server.
- **Risk:** clickjacking (no frame-ancestors), MIME sniffing, referrer leakage of the API origin. For a public launch this is a baseline gap.
- **Fix (server):** add `helmet` (or manual headers) — `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`), `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive CSP. **Fix (Vercel):** add the same headers via `vercel.json` (currently only `env` is set).
- **Affected files:** `server/src/app.js` (+ add helmet), `vercel.json`.
- **Effort:** ~1 hr. **Risk:** Low (test CSP against the Google Fonts `@import` and the dicebear fallback).

### P2-4 — `POST /api/swipes/log` 400 echoes the full request body (`received: req.body`)
- **Detail:** On validation 400 the server returns `received: req.body` (e.g. `{"error":"Invalid userId format","received":{"userId":"user-123",...}}`). This is low-risk (it's the client's own payload) but it's unnecessary leakage and bloats logs. The 500 handler is correctly generic.
- **Fix:** drop `received` from responses; log it server-side only.
- **Affected files:** `server/src/routes/swipes.js:53-68`.
- **Effort:** ~10 min. **Risk:** None.

### P2-5 — No error monitoring / no source maps in prod
- **Detail:** ErrorBoundary falls back to `console.error` (browser) and the server logs to stdout; there is no Sentry/Datadog. No `sourceMappingURL` in the prod bundle (good for IP, bad for debugging). For "thousands of users" you cannot see client errors.
- **Fix:** add an error reporter (Sentry free tier) and server-side logging/alerting on 5xx.
- **Effort:** ~2 hr. **Risk:** Low.

### P2-6 — Bundle performance: 2 large PNGs not optimised/lazy, JS 82 KB gz
- **Detail:** `dist/assets/Obama Header No BG-*.png` = 380 KB and `New Globe-*.png` = 268 KB shipped in the main bundle (not lazy, not WebP). The header image in particular is rendered at ~300–360 px tall. `index-*.js` = 287 KB (82 KB gzip) — acceptable, but the PNGs are the real weight (≈1.5 MB `dist` total).
- **Fix:** convert both to WebP/AVIF, cap dimensions, and lazy-load the globe (it's decorative). Honors the repo's own image-optimisation guardrail.
- **Affected files:** `rate-my-president-demo/src/App.tsx:11` (imports Obama header), `NewsTicker.tsx:2` (globe).
- **Effort:** ~1 hr. **Risk:** Low.

### P2-7 — News ticker driven by a hardcoded 7-leader subset, not the president set
- **Detail:** `NewsTicker.tsx` hardcodes UK/FR/US/IN/BR/ZA/AU. Leaders like Zelensky, Putin, Xi, Modi (India ok) appear/disappear arbitrarily and are not derived from the 26 seeded presidents. Inconsistent with the data model.
- **Fix:** derive ticker entries from `api.getPresidents()` (with real headlines once P1-5 is done), or remove the fake ticker.
- **Effort:** ~1 hr. **Risk:** Low.

### P2-8 — Leader name duplicated in accessibility tree
- **Detail:** Each row's name gridcell is also `role="button"` with `onClick`, so the a11y name is announced twice ("Donald Trump Donald Trump"). Confirmed in the browser a11y snapshot.
- **Fix:** move the clickable affordance to a button *inside* the cell (or use `aria-label` once and keep the text node un-labelled), instead of making the whole `td` a button that also contains the visible name.
- **Affected files:** `rate-my-president-demo/src/Leaderboard.tsx:492-501`.
- **Effort:** ~20 min. **Risk:** Low.

### P2-9 — 24-hour country-change lock enforced only in `localStorage`
- **Detail:** `onboardingStorage.setCountryLock()` writes to `localStorage`. A user can clear storage (or use a different browser) to re-pick a home country and re-cast the reserved "home" vote. The server has no record of the lock.
- **Why it matters:** the "home" vote is a privileged slot (1 of 2 daily); a bypassable lock enables home-country vote manipulation.
- **Fix:** enforce the lock server-side (`user_preferences.home_country_locked_until`), or accept the client-side lock as a UX nudge and document it as non-security.
- **Affected files:** `rate-my-president-demo/src/onboardingStorage.ts`, `server/src/routes/preferences.js`.
- **Effort:** ~2 hr. **Risk:** Medium.

---

## LOW PRIORITY (P3)

### P3-1 — `validateUserId` requires strict v4 UUID; blocks any future ID scheme
- **Detail:** `server/src/utils/validateUserId.js` rejects anything that isn't a v4 UUID. Current client uses `crypto.randomUUID()` (v4) so it's fine today, but it prevents sentinel/test IDs or a future non-UUID anonymous scheme, and returns 400 (not 401) on bad input.
- **Fix:** relax to "valid UUID" or a length/format check; align error semantics.

### P3-2 — Dead dependency `sql.js` in `server/package.json`
- **Detail:** `sql.js` is listed but only referenced in comments (`db/client.js`). `wilson-score-rank` is used.
- **Fix:** remove `sql.js` from `server/package.json` (and `npm prune`).

### P3-3 — `og:image` is fine (36 KB) but `sitemap.xml` lists only the homepage
- **Detail:** No per-route sitemap entries (acceptable for a SPA), but add `<lastmod>` and consider `image:image` for the OG asset. Low priority for launch.

### P3-4 — Railway `healthcheckTimeout: 100` may be too tight
- **Detail:** `railway.json` sets `healthcheckTimeout: 100` (ms). Cold-start DB connect under load could fail the healthcheck and trigger `ON_FAILURE` restarts. Verify against observed boot time (current uptime shows it boots, but 100 ms is aggressive).
- **Fix:** raise to a sane value (e.g. 5000–10000 ms) or rely on Railway defaults.

### P3-5 — Nominatim proxied to a single hardcoded instance, no fallback / no real UA by default
- **Detail:** `nominatim.js` hits `nominatim.openstreetmap.org` with UA `rate-my-president/1.0` unless `NOMINATIM_USER_AGENT` is set. OSM's usage policy expects a valid identifying UA + contact. No fallback geocoder. If OSM rate-limits, onboarding geolocation silently fails (manual select still works).
- **Fix:** set a real UA + contact, add a secondary provider or graceful degradation, cache TTL.

### P3-6 — `Access-Control-Allow-Origin: *` on the static Vercel origin
- **Detail:** `curl` shows `Access-Control-Allow-Origin: *` on `ratemypresident.xyz`. Harmless for a static SPA (no cookies/credentials), but tighten to the known origin if any credentialed request is ever added.

### P3-7 — `SwipeCard.tsx` / `Onboarding.tsx` / `Leaderboard.tsx` are very large (618 / 901 / 579 lines)
- **Detail:** tech-debt / maintainability. Consider splitting gesture logic, onboarding screens, and leaderboard rows into smaller modules.

### P3-8 — Duplicate shared modules at root vs demo (`Icons.tsx`, `AnimatedFlag.tsx`)
- **Detail:** Both root and `rate-my-president-demo/src` contain `Icons.tsx` / `AnimatedFlag.tsx`. AGENTS.md says the demo imports the root copies via `@root`; the demo-local copies may be stale duplicates. Verify the demo imports resolve to root and delete the duplicates.

---

## PHASE 3 — `POST /api/swipes/log` 400: exact reason

The task asked to determine the exact reason this endpoint returns 400. **Reproduction against prod shows it works correctly for a valid payload** (`200 {"allowed":true}`). The 400s fall into two categories:

1. **Intended business-rule 400 (the normal "400" users see):** when the same `userId`+`cardType` already has a row for today, the server returns `400 {"allowed":false,"reason":"Already voted today for this card type"}`, and `429`-style daily-limit returns `400 {"allowed":false,"reason":"Daily swipe limit reached"}`. These carry `allowed:false` and the frontend's `ApiBusinessError` path surfaces `reason` correctly. **This is by design, not a bug.** A "failed swipe" in normal use is almost always this guard.

2. **Validation 400 (defensive, rarely hit by the real client):** `400 {"error":"Missing required fields"|"Invalid userId format"|"Invalid action"|"Invalid card type", received: <body>}` triggered when `userId`/`presidentId`/`cardType`/`action` is missing/empty, `userId` is not a strict v4 UUID, `action` ∉ {like,nolike,skip} (aliases approve/disapprove/oppose are normalised — confirmed `approve`→ already-voted path, not invalid), or `cardType` ∉ {home,global}.
   - The frontend always sends a v4 `userId` (crypto.randomUUID), valid `action`, valid `cardType`, and a real `presidentId`, so under normal operation **the only 400 the frontend receives is the business-rule one (case 1).**
   - The lone realistic way the frontend hits a *validation* 400 is if `presidents` fails to load and `currentCard.id` is `undefined` → "Missing required fields". That is a downstream symptom of a presidents-fetch failure, not a swipes-endpoint bug.

**Conclusion:** There is no spurious/buggy 400 in `/api/swipes/log`. Treat the reported 400 as the expected daily-limit/duplicate guard. The endpoint that *actually* crashes is the **leaderboard region filter (P0-1, HTTP 500)**.

---

## Phase 1 — Build & Environment (summary)
- `npm install` (demo + server): OK.
- `tsc -b` (demo): passes, no errors. `noUnusedLocals`/`noUnusedParameters` enabled.
- `vite build`: succeeds. Output 287 KB JS (82 KB gz) + 648 KB PNGs + avatars.
- `oxlint`: configured (`@oxlintrc.json`); not run in CI here but no lint step is wired into `build`.
- Tests: `npm test` exists (vitest) but only `swipeLockStorage.test.ts` is present; no API/component coverage for the bugs above.
- Deprecated/unused: `sql.js` dead (P3-2). No deprecated packages flagged.
- Warnings: none from build. `index.html` references `/favicon.svg` (exists) and `/manifest.json` (exists). `og-image.png` present.

## Phase 2 — Console Audit (summary)
- Production page: **no console errors, no React warnings, no failed promises** on load and happy-path swipe.
- Source maps: not published (intended).
- No CSP violations logged (because there is no CSP — see P2-3).

## Phase 4–13 — Additional confirmations
- **User flow:** onboarding → swipe → leaderboard all navigable; first swipe persists (200); second swipe same day correctly locked ("Daily limit reached: 1/1" for no-home-country user). Reload preserves UUID + country via localStorage.
- **Responsive:** card uses `min-h-[420px]` / `max-w-[420px]` and `dvh`; no horizontal overflow observed at 320/375/414. `html/body` `overflow:hidden` locks page scroll (intended); leaderboard scrolls internally.
- **Accessibility:** ErrorBoundary wraps each panel (good); keyboard shortcuts exist (arrows/L/R/S); but trend column (P2-1) and duplicate-name a11y (P2-8) are issues. No visible focus-ring styling audit performed.
- **SEO:** title/description/OG/Twitter/canonical/manifest/robots/sitemap all present and served. `og:image` 36 KB OK. Sitemap minimal (P3-3).
- **Security:** see P2-3, P2-4, P3-1. No XSS vector found (React escapes); the only injection-shaped code is the `received: req.body` echo (P2-4). No auth tokens (anonymous UUID by design).
- **Backend contract (Phase 13):** frontend `action` enum (`like/nolike/skip`) matches server; server also tolerates `approve/disapprove/oppose` aliases. `presidentId` sent as string, stored as TEXT — OK. `avatar_url` is a relative `/avatars/x.png`; `resolveAvatar()` rewrites to `.webp` against the frontend origin — works (200 on `/avatars/donald-trump.webp`). Leaderboard `region` param validated (400 on bad value) but crashes on valid+all (P0-1).

---

## Recommended fix order before public marketing
1. **P0-1** leaderboard region 500 (server SQL fix + regression test).
2. **P1-1 / P1-2** wire time-window + region to the real API.
3. **P1-3** require explicit confirmation of geolocated home country.
4. **P1-4** fix swipe-failure rollback so the card never strands.
5. **P1-5** remove/hide fabricated `[DEMO]` news before launch.
6. **P1-6** rewrite `APP_READINESS.md`.
7. Then P2 security headers, perf, a11y, and P3 cleanups.

**Bottom line:** the app is structurally sound and the happy path works, but it is **not ready for public marketing** until P0-1 and the P1 set are resolved — especially the server crash, the broken time-window control, the unconfirmed geolocation home-country assignment, and the fabricated news on the live site.
