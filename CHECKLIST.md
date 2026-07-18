# Rate My President — Release Checklist

Use before any deploy or feature sign-off. Maps to PRD sections.
Last updated: 2026-07-18

## Product rules (non-negotiable)

- [ ] Swipe limit enforced server-side: 1/day (no home country) or 2/day (home country set; 1 home leader + 1 international).
- [ ] Skip consumes the daily swipe. Daily vote locked server-side.
- [ ] Leaderboards use adjusted confidence score (Wilson or equivalent), not naive %.
- [ ] News headlines pulled mechanically from approved allowlist only.
- [ ] Anonymized local UUID for swipe tracking; no device fingerprinting.
- [ ] In-app disclaimer visible: "Entertainment product. Reflects activity of app users only — not a scientific or representative poll."

## UI / split-register

- [ ] Playful layer (gesture, voice, reveal motion) and serious layer (data, leaderboards) both fully committed per screen — never blended.
- [ ] Swipe gesture: 300–350ms drag + elastic overshoot (ease-out-quart).
- [ ] Reveal: 600ms count-up + 250ms card flip (ease-out).
- [ ] All motion respects `prefers-reduced-motion: reduce`.

## Accessibility (WCAG 2.1 AA)

- [ ] Color + text for every affordance.
- [ ] Semantic HTML for leaderboard (table).
- [ ] Avatar readability at small sizes.
- [ ] Disclaimer always visible.

## Pre-deploy

- [ ] Manual verification of swipe lock logged.
- [ ] Leaderboard score recalculated against known inputs.
- [ ] No real payment secrets, private codes, or live endpoints in client bundle.
- [ ] AGENTS.md updated to current (code-bearing) state.

## Open gaps

- [ ] Automated test for swipe-lock and Wilson-score logic (see TRACKER.md RMP-06).
