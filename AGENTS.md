# Rate My President — AI Agent Guide

## Project snapshot
This is a **real, buildable codebase**, not docs-only. It is a gamified swipe-to-rate app (React + Vite + TypeScript frontend, Express 5 + sql.js backend).

- **Frontend (source of truth):** `rate-my-president-demo/` — `npm run build` = `tsc -b && vite build`. This is the app that ships.
- **Static assets & `publicDir`:** `vite.config.ts` sets `publicDir` to the **repo-root `public/`** (NOT `rate-my-president-demo/public/`). Any file you want served at runtime (avatars, `robots.txt`, `sitemap.xml`, `manifest.json`, `favicon.*`) MUST go in repo-root `public/`. Files placed in `rate-my-president-demo/public/` are silently ignored by the build. After changing assets, rebuild and confirm they appear in `dist/` — a missing file in `dist/` means it was in the wrong `public/`.
- **Backend:** `server/` — Express 5 REST API + Postgres (pg). Daily swipe-lock enforced server-side.
- **Shared modules:** component files at repo root (`Icons.tsx`, `AnimatedFlag.tsx`, `swipeLockStorage.ts`, `assets/`) are imported by the demo via the `@root` alias (`vite.config.ts` maps `@root` → repo root). These are shared, not duplicate.
- **Docs:** PRD / design theory / PRODUCT.md / DESIGN.md / onboarding + leaderboard integration notes live at repo root and in `docs/`.

## Agent operating rules (Kudzie / KudzBot)
- **Owner autonomy:** Kudzie delegates decisions. Act as owner, not consultant — make the call, state reasoning briefly, execute. Do not ping for low-stakes choices.
- **Verify, don't assume:** always run `npm run build` (and `tsc --noEmit` at root) before claiming work is done. Unbuilt WIP branches hide JSX/contract errors.
- **Extend, don't trim:** when a demo expects a richer component API than the component exposes, extend the component to match the demo (the demo is the intended direction), not the reverse.
- **Preserve loose work:** before risky git moves (checkout/reset/merge/rebase), commit in-flight work to a `wip/...` branch.
- **PRs are real, not drafts:** use `gh pr create` without `--draft` (drafts don't auto-review).

## Pre-production guardrails (prevent recurrence of audited bugs)
These are enforced rules, not suggestions. Each maps to a production-readiness failure found in the Devin + Antigrav audits.

- **Image optimization is mandatory pre-merge.** No raster image (>50 KB) may be committed to `public/` as PNG/JPG. Convert to WebP at ≤120 KB, longest side ≤450px (avatars) using an automated step. Before committing new assets, run the conversion and verify size. The 35 MB → 312 KB avatar regression was a direct miss here.
- **No third-party API calls from the browser.** Geocoding, and any external service, MUST go through a backend route (e.g. `/api/geocode`). Calling Nominatim/OSM/etc. directly from the client leaks abuse surface and breaks under CORS. If you must add an external call, add a backend proxy first.
- **Error boundaries are required.** Every route-level panel (onboarding, swipe, leaderboard) MUST be wrapped in `ErrorBoundary`. A component crash must show a retry UI, never white-screen the app.
- **No `console.log` in production code paths.** Debug logging left in shipped components (e.g. click handlers) is removed before merge. Use a real logger or strip in build.
- **SEO baseline for any public launch.** `index.html` must include `description`, Open Graph, Twitter Card, and canonical tags; `public/` must contain `robots.txt`, `sitemap.xml`, and `manifest.json`. Verify they survive into `dist/` after build.
- **Asset paths must survive the build.** After adding any static file, rebuild and `curl`/`ls dist/` to confirm it is served. Relative paths from the API (e.g. `/avatars/x.png`) must be resolved against the FRONTEND origin, never the API host — rewrite extensions (`.png`→`.webp`) and pin origin in the client.
- **Business-rule 400s are not errors.** When the backend returns `400` with a typed body (`{ allowed: false, reason }`), the client must surface `reason` to the user — not throw a generic "could not be saved". Distinguish validation 400s from business-rule 400s.
- **News/content integrity.** No fabricated or outdated political facts. Headlines referencing specific leaders must be current-term; demo/placeholder content must be explicitly labelled `[DEMO]`. Real news must come from an approved allowlist endpoint, never hardcoded.
- **Verify, don't assume (build + asset check).** `npm run build` must pass AND `dist/` must contain every expected static asset before claiming done. Unbuilt or mis-pathed assets hide until production.

## Architecture notes
- The demo imports shared modules from root via `@root`. Do NOT duplicate root shared modules into `rate-my-president-demo/src/` — import them.
- `SwipeCard.types.ts` is the single `SwipeCardProps` source. `SwipeCard.tsx` imports it (no inline duplicate interface).
- `onVote: (action: VoteAction) => boolean | Promise<boolean>` — the handler returns whether the vote was accepted (false when the daily limit is hit). Component uses `allowed !== false`.
- Vote-lock UI: `SwipeCardProps.isLocked` / `nextResetAt` / `onShowLeaderboard` render a lock overlay and disable interaction.

## Important product constraints (from PRD)
- Swipe limit: 1/day if no home country; 2/day if home country set (1 home leader, 1 internationals). Daily vote locked server-side; skip consumes the swipe.
- Gamified sentiment tracker — NOT a debate platform, pollster, or betting product.
- UI tone is split: playful interaction (gesture/voice/reveal) + serious data presentation (clean type, consistent leaderboards). Never blend.
- Leaderboards ranked by adjusted confidence score (Wilson or equivalent), not naive %.
- News headlines pulled mechanically from an approved allowlist, not manually curated.
- Anonymized local UUIDs for swipe tracking; no device fingerprinting.
- In-app disclaimer required: "Entertainment product. Reflects activity of app users only — not a scientific or representative poll."

## Design system (quick reference)
- **Register:** product app (swipe + leaderboards are core).
- **Brand:** Playful + credible, each fully committed per screen.
- **Color (OKLCH):** Navy ink `oklch(0.15 0.04 250)` base; Green `oklch(0.62 0.18 142)` approve; Red `oklch(0.55 0.20 25)` disapprove; Amber `oklch(0.72 0.15 65)` streaks/non-vote.
- **Type:** Inter (data/figures) + Space Grotesk (voice/headlines), both variable, 400–700.
- **Motion:** swipe 300–350ms elastic; reveal 600ms count-up + 250ms flip; else fast/quiet. All respect `prefers-reduced-motion`.
- **A11y:** WCAG 2.1 AA. Color + text for every affordance. Reduced-motion alt. Disclaimer always visible.

## Reference docs
- `rate-my-president-prd.md` — requirements, mechanics, data model, trust/safety
- `rate-my-president-design-theory.md` — visual/motion/interaction
- `PRODUCT.md` — strategic framework; `DESIGN.md` — visual system
- `INTEGRATION.md`, `ONBOARDING*.md`, `LEADERBOARD*.md` — delivery notes
- `APP_READINESS.md` — current build/readiness status
