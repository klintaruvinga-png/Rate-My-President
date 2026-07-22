# Rate My President — AI Agent Guide

## Cross-Cutting Rules (load before project-specific rules)
**Single source of truth:** `docs/GOVERNANCE.md` in this repo (synced read-only copy). Canonical/edited source: `C:\Users\Kudzie\OneDrive\SS - Apps & Software\EOM\GOVERNANCE.md`.
Every session in this repo MUST load GOVERNANCE.md first. It defines the EOM automation contract (registry/TRACKER sync, cron cadence, non-draft PR rules, verify-don't-assume), the BrainWorks producer protocol (read-only curation, append-only observations.jsonl), and the cross-project documentation rule. This repo's rules below are additional, not a replacement.

## Project snapshot
This is a **real, buildable codebase**, not docs-only. It is a gamified swipe-to-rate app (React + Vite + TypeScript frontend, Express 5 + sql.js backend).

- **Frontend (source of truth):** `rate-my-president-demo/` — `npm run build` = `tsc -b && vite build`. This is the app that ships.
- **Backend:** `server/` — Express 5 REST API + sql.js (WASM SQLite). Daily swipe-lock enforced server-side.
- **Shared modules:** component files at repo root (`Icons.tsx`, `AnimatedFlag.tsx`, `swipeLockStorage.ts`, `assets/`) are imported by the demo via the `@root` alias (`vite.config.ts` maps `@root` → repo root). These are shared, not duplicate.
- **Docs:** PRD / design theory / PRODUCT.md / DESIGN.md / onboarding + leaderboard integration notes live at repo root and in `docs/`.

## Agent operating rules (Kudzie / KudzBot)
- **Owner autonomy:** Kudzie delegates decisions. Act as owner, not consultant — make the call, state reasoning briefly, execute. Do not ping for low-stakes choices.
- **Verify, don't assume:** always run `npm run build` (and `tsc --noEmit` at root) before claiming work is done. Unbuilt WIP branches hide JSX/contract errors.
- **Extend, don't trim:** when a demo expects a richer component API than the component exposes, extend the component to match the demo (the demo is the intended direction), not the reverse.
- **Preserve loose work:** before risky git moves (checkout/reset/merge/rebase), commit in-flight work to a `wip/...` branch.
- **PRs are real, not drafts:** use `gh pr create` without `--draft` (drafts don't auto-review).

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
