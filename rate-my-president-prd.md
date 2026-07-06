# Rate My President — Product Requirements Document

**Version:** 1.0 (Draft — all open questions resolved, ready for engineering breakdown)
**Owner:** Kudzie / SS Developers
**Status:** Pre-build — for engineering scoping
**Last updated:** 2026-07-06

---

## 1. Summary

Rate My President is a swipe-based web app that lets users cast one daily vote of approval or disapproval on a rotating deck of world leaders. Each swipe is paired with a real, linked news headline, turning a lightweight Tinder-style game into an ambient global sentiment tracker. The product's core tension — and its appeal — is that it's built like a meme app but functions like a live polling instrument.

**One-line pitch:** Tinder for presidents. Swipe once a day, see who the world just cancelled.

---

## 2. Goals

### 2.1 Product goals
- Make political engagement feel low-friction, funny, and habitual rather than heavy or partisan.
- Surface real news alongside every swipe so the game has an informative backbone.
- Produce genuinely interesting aggregate data (leaderboards, trends, regional splits) as a byproduct of play.
- Build a mechanic (one swipe/day) that drives daily-return habits without needing notifications spam.

### 2.2 Business goals
- Establish a low-cost, high-shareability product under the SS Developers / Stokvel Society umbrella that can carry its own traffic virally (share cards, leaderboard flexing).
- Create a reusable "gamified sentiment" engine that could later extend to other domains (companies, celebrities, sports figures) if the format proves out.

### 2.3 Non-goals (v1)
- Not a debate platform — no comments, no threads, no arguments in-app.
- Not a news aggregator — we link out, we don't republish or summarize articles ourselves.
- Not a polling company — we don't claim statistical rigor or represent results as scientific polling.
- Not a real-money or betting product.

---

## 3. Target Users

| Segment | Motivation |
|---|---|
| Casual/meme audience | Wants a 5-second daily dopamine hit, screenshots the leaderboard to group chats |
| Politically engaged users | Wants a low-effort way to register opinion daily, checks news links for context |
| News-curious lurkers | Doesn't swipe much, but browses leaderboards and headlines passively |
| Global audience | Non-US users specifically — the "world leaders" framing (not just one country) is a differentiator vs. US-only political apps |

---

## 4. Core Mechanic

### 4.1 The swipe deck

**Swipe allowance: one swipe, one president, once per day. No exceptions, no reroll.**

- Each user is shown **exactly one leader card per day** — never a deck, never a queue, never a choice of who to see.
- The user gets **one gesture** on that card. Once submitted, the swipe is locked server-side for that user (Redis `SET NX EX 86400`) until the next daily reset — not just hidden client-side, since a client-only lock is trivially bypassed by refreshing.
- The user **does not select** which president they see. The rotation engine (Section 4.2) assigns the card.
- **Skip consumes the daily swipe.** Skipping is "I pass today," not "show me someone else." This is a deliberate anti-loophole rule — if skip granted a reroll, users would skip past unfamiliar/less "swipeable" leaders to fish for an easier or funnier card, which defeats the rotation logic in 4.2 and quietly re-introduces a popularity bias into the leaderboard data.
- Across the full roster (15–25 leaders at MVP), a single user **never rates the whole roster in one sitting.** They rate one leader per day, and an active daily user cycles through most/all of the roster over time, spread across days — this pacing is the mechanic, not a limitation. It's what makes this a daily-habit product instead of a one-time quiz.

Swipe gestures:

| Gesture | Meaning | Score weight |
|---|---|---|
| Swipe right | Approve | +1 |
| Swipe left | Disapprove | -1 |
| Swipe up | Skip / no opinion | 0 (recorded as "pass") |
| Press-and-hold down | "Rage swipe" (emphatic disapprove) | -1 — same weight as a normal disapprove |

> **v0.2 revision:** Rage Swipe was originally weighted at -2. This has been capped to -1, identical to a standard disapprove. A double-weighted negative action is a lever a coordinated group can pull to move a leaderboard disproportionately, even with the one-swipe-per-day cap in place — the gesture stays for player expression/fun, but it no longer carries extra scoring power. Revisit only once real anomaly detection is in place and proven.

- After swiping, the card **flips** to reveal:
  - Current approval percentage (all-time and 7-day trend arrow)
  - 1–2 linked headlines with source name, publish date, and outbound link
  - A "you rated this person X today" confirmation state

### 4.2 Deck composition logic
- Deck is not purely random — a weighted rotation ensures:
  - Users see a mix of well-known and lesser-known leaders (keeps it educational, not just "rate the 5 leaders everyone knows")
  - No single leader appears for the same user more than once every N days
  - Optional "region" or "spotlight" decks tied to current events (e.g., election season surfacing that country's leader more often)

### 4.3 Streaks & light gamification
- Daily streak counter (non-punishing — missing a day doesn't reset historical stats, just the streak number)
- Optional end-of-week "Your Political Compass" summary: aggregate pattern of the user's own swipes (e.g., approval rate by region/party) — framed as a fun mirror, not a label.

> **v0.3 addition — design objective, not a feature list:** the swipe itself is not the habit loop; it's ~10 seconds of interaction. What justifies opening the app *tomorrow* is what's shown in the moment right after the swipe — "today's biggest mover," "how your region voted," "only 18% agreed with you," a historical trend line. This PRD does not commit to a specific set of these surfaces at MVP (see Section 11 for what actually ships), but **"what happens in the 10 seconds after the swipe" is a required design question to answer deliberately before launch**, not something left to emerge after the fact. At minimum, the MVP card-flip reveal (Section 4.1) already does some of this work (approval %, trend arrow); treat expanding it as the primary lever for retention, ahead of adding new top-level features.

---

## 5. Leaderboards & Discovery Surfaces

| Surface | Definition | Refresh |
|---|---|---|
| President of the Day | Highest net approval (approvals − disapprovals) in trailing 24h | Rolling, cached ~60s |
| President of the Week | Same, trailing 7 days | Rolling, cached ~5min |
| President of the Month | Same, trailing 30 days | Rolling, cached ~15min |
| President of the Year | Same, trailing 365 days / calendar year | Daily snapshot |
| Currently Lowest Rated ("Hall of Shame") | Inverse of above, same windows | Same cadence |
| Biggest Mover | Largest rank change vs. prior period | Daily |
| Regional boards | Leaderboards filterable by continent/region (Africa, Europe, Asia, Americas, Oceania) | Same cadence as global |

All leaderboard numbers are computed from raw swipe counts — no manual curation, no editorializing on ranking. The presentation (card style, avatar treatment, stat layout) is **identical regardless of who's on top or bottom** — this consistency is what keeps the product defensibly "a game," not "a hit piece."

> **v0.2 revision:** Regional boards are promoted from "stretch goal" to **MVP requirement**. A global-only leaderboard is misleading by construction if early traffic skews heavily to one country or region — presenting that as "world sentiment" overstates what the data actually shows. A basic region toggle (even just a dropdown filter over the same underlying computation) ships with v1.

---

## 5a. Ranking Methodology

**Problem:** raw net score (approvals − disapprovals) rewards low-volume leaders unfairly. A leader with 9 approvals and 1 disapproval (net +8, 90%) will outrank a leader with 90,000 approvals and 10,000 disapprovals (net +80,000, still 90%) if leaderboards sort on percentage alone — and naive net score alone over-favors sheer volume in the other direction. Neither raw percentage nor raw net count alone produces a trustworthy ranking. This is a solved problem in other ranking systems (Reddit comment sorting, Steam review scores, IMDb weighted ratings) and Rate My President needs the same treatment before leaderboards ship.

**Approach for v1:** rank using a **Wilson score lower bound** (or an equivalent Bayesian-adjusted approval rate) rather than naive net score or raw percentage. This produces a ranking that accounts for both approval rate *and* confidence from sample size — a leader needs both a good ratio and enough swipes behind it to rank highly, which is a fairer and more defensible statistic if the numbers are ever scrutinized publicly.

- `LeaderboardSnapshot` (Section 7) computes and stores the Wilson-adjusted score per window, not just raw net score.
- Raw counts (approvals, disapprovals, total swipes) remain visible on the card/leaderboard for transparency — the adjusted score determines rank, but users can see the underlying numbers, not just a black-box position.
- Document the exact formula used in a public-facing "How rankings work" page (see Section 8a) so the methodology isn't a mystery if a leader's supporters or detractors accuse the app of bias.
- **The ranking formula itself is versioned** (`algorithm_version`, Section 7). If the formula changes post-launch, past snapshots stay frozen under the version that produced them rather than being retroactively recalculated — history reflects what was actually shown at the time.

---

## 6. News Integration

> **v0.5 decision:** no manual, per-leader headline curation. A single person choosing which specific story represents each leader is itself an editorial act — it would quietly reintroduce the exact bias the rest of this PRD works to avoid (Section 8's "no editorializing on ranking" only holds if the news layer is equally hands-off). Instead, headline selection is fully mechanical and always shows multiple qualifying headlines, never one hand-picked story.

- **Source allowlist, not story selection.** The one human decision in this system is a one-time (and periodically revisited) approval of a fixed list of neutral wire-service and major national outlets (e.g., Reuters, AP, AFP, and similar). This is a judgment about source *quality/neutrality* in general, never about which specific story to feature for which leader.
- **Automatic pull, no single pick.** Every leader card surfaces **2–3 qualifying headlines automatically** — the most recent items mentioning that leader/country from the approved source list within a rolling window (e.g., last 7 days). No ranking of which is "the" story; they're shown as a set. If fewer than 2–3 qualifying headlines exist in the window, the card shows whatever qualifies (including zero, gracefully — see below).
- **Display rule (unchanged):** headline + source name + publish date + outbound link only. No summarization or rewriting of article content into our own claims.
- **Sourcing rule (unchanged):** approved-list sources only; no partisan opinion sites, no unverified sources.
- **Ingestion approach:** this decision pushes v1 toward a **licensed news API integration** (e.g., NewsAPI, GDELT, or similar) rather than manually maintained JSON, since a human hand-assembling "here are 2–3 headlines" per leader is functionally the same manual curation problem in a different shape. This is more engineering upfront than the original manual-JSON plan, but it's the only way to make "no one hand-picks the story" actually true rather than nominally true.
- **Empty-state handling:** if a leader has no qualifying headlines in the rolling window (a quiet news period), the card shows a neutral "no recent qualifying coverage" state rather than reaching outside the approved sources or window to force a result — resisting the temptation to backfill is part of keeping selection mechanical.

---

## 7. Content & Data Model

```
President {
  id
  name
  country
  role_title        // "President", "Prime Minister", etc. — app should generalize
  party
  term_start
  term_end (nullable)
  avatar_style_id    // stylized caricature, not real photo
  region
  territory_status   // "recognized_state" | "disputed" — see Section 8a Editorial Policy
  active (bool)      // controls deck rotation eligibility
}

Swipe {
  id
  user_ref           // anonymous client-generated UUID (not a device fingerprint) or account id
  president_id
  action             // approve | disapprove | rage | skip
  date               // for daily-lock enforcement
  timestamp
  region_of_voter    // coarse, for aggregate stats only
}

NewsLink {
  id
  president_id
  headline
  source_name
  source_url
  published_at
  ingested_at        // when the automated pull surfaced this item
  source_allowlist_id // which approved source this came from
}

LeaderboardSnapshot {
  window             // day | week | month | year | region-scoped variant
  president_id
  approvals
  disapprovals
  total_swipes
  net_score          // raw, kept for transparency/display
  wilson_score       // adjusted ranking score — see Section 5a
  algorithm_version  // which ranking formula produced this snapshot — see below
  region             // nullable — null = global
  computed_at
}
```

- **Leaderboards are computed, not authoritative-stored** in the primary DB — they're a live/cached view over `Swipe`, backed by a fast counter layer (see Section 9).
- `Swipe.user_ref` avoids device fingerprinting (see Section 8) — a client-generated anonymous UUID stored locally is sufficient for v1 and carries fewer privacy/regulatory complications, paired with server-side fraud/velocity detection instead of identity-based tracking.
- **Swipe history is append-only and immutable.** No swipe row is ever edited or deleted after the fact (corrections happen via new compensating records, not mutation) — this is what makes historical analysis (biggest approval collapse after an election, fastest sentiment recovery, regional divergence over time) possible later without having quietly discarded the raw material. The data model is built analytics-first even though no analytics UI ships at v1.
- **`LeaderboardSnapshot` rows are frozen under the `algorithm_version` that produced them.** If the ranking formula changes later (e.g., net score → Wilson score, or a future refinement), historical snapshots are never silently recalculated or rewritten under the new formula — they remain a true record of "what the leaderboard said on that date, under that method." New snapshots going forward use the new version. This is standard practice for any ranking system expected to evolve (the alternative is quietly rewriting history every time the formula improves).

---

## 8. Trust, Safety & Legal Considerations

This is the section most likely to bite a solo-built political app if skipped — treated as first-class requirements, not "nice to haves."

| Risk | Mitigation |
|---|---|
| Real photos of real people → likeness/publicity rights issues | Use stylized, consistent cartoon caricature avatars for every figure, not photos |
| Leaderboard brigading (bots, coordinated mass-swiping to move rankings) | Server-side daily lock, rate limiting, anomaly detection on swipe velocity per IP/ASN, CAPTCHA fallback if abuse detected |
| Perceived political bias in presentation | Identical card template, identical stat treatment, identical avatar style regardless of leader/party/country; no ranking overrides or manual boosts |
| Defamation / reputational claims | No user-generated comments or captions attached to named real people in v1; headlines are unedited links to third-party journalism, not in-app claims |
| Data privacy / fingerprinting | **v0.2 revision:** avoid device fingerprinting (increasingly restricted by browsers and disfavored by GDPR regulators). Use a client-generated anonymous UUID stored locally instead, paired with server-side fraud/velocity detection for abuse signals — solves the same problem without the identity-tracking baggage |
| Misrepresentation as scientific polling | **v0.2 addition:** in-app disclaimer required on leaderboard and card-flip surfaces, not just in this PRD — e.g. "Entertainment product. Reflects activity of app users only — not a scientific or representative poll." Visible, not buried in a footer, given how easily "approval %" language reads as polling data once shared out of context (e.g. screenshotted into news coverage) |
| Data privacy (general) | No account required for v1; anonymous swipe tracking via local UUID; clear, short privacy notice; comply with POPIA (given SS Developers' SA base) and GDPR basics for EU visitors |
| Misinformation via news links | **v0.5 revision:** mitigated structurally, not by human review — headline selection is fully mechanical from a fixed, pre-approved source allowlist (Section 6), with no per-story human judgment call to get wrong or bias. Risk shifts to allowlist maintenance (keeping the source list itself credible) rather than per-headline review |
| Minors / age-appropriateness | Light-hearted cartoon framing keeps this closer to satire than harassment, but app should still carry a general content notice given political subject matter |

---

## 8a. Editorial & Geopolitical Policy

Politics doesn't allow neutrality-by-default — the moment a roster is assembled, decisions have been made. This section makes those decisions explicit rather than leaving them to whoever happens to add a leader to the database.

**Disputed territories and contested statehood.** Cases like Taiwan, Kosovo, Palestine, Western Sahara, and Crimea don't have a single internationally agreed answer. Rate My President needs a stated, consistent policy rather than ad hoc calls made leader-by-leader.

> **v0.3 decision:** the UN member state list is adopted as the reference standard for the "recognized state" tier. This is a pragmatic, defensible, widely-recognized convention — not a claim that it's the only valid framework, but a consistent, citable rule that removes case-by-case editorial judgment calls.

- `territory_status` (Section 7) is set as `recognized_state` for current UN member states, `disputed` for everything else.
- **v1 roster is drawn exclusively from `recognized_state` entries.** Disputed-territory leaders are deferred, not included, at launch — this avoids taking a position on the hardest cases before the product has any track record, and can be revisited deliberately later with its own labeling policy rather than folded in by default now.
- Whatever the call, the rule is applied consistently across all disputed cases — no selective exceptions.

**Leader inclusion criteria.**

> **v0.4 decision:** roster scope is heads of state and/or heads of government only (whichever holds the effective top executive role per country) — no opposition leaders, party figures, or other "prominent" political actors in v1. This keeps the inclusion rule mechanical: UN member state (Section 8a) → current officeholder in the top job, full stop. No ongoing subjective judgment about who counts as sufficiently prominent, which keeps both the roster-building work and the moderation surface bounded.

- One entry per UN member state: the current head of state or head of government (whichever is the effective executive — e.g., PM in parliamentary systems, President in presidential systems)
- Minimum criteria for inclusion/removal (e.g., recognized office-holder, removed promptly on leaving office or death)
- Who has authority to add, remove, or relabel a leader entry, and what the review step looks like even at solo scale

**Correction process.** A public, simple way for someone to flag a factual error (wrong title, wrong country, outdated term dates, wrong avatar) with a stated response time — this is cheap to set up now and becomes a credibility asset if the product gets media attention later.

**Rapid-response path.** Real-world events (death, coup, resignation, snap election) can invalidate a card overnight. This connects directly to the admin console requirement in Section 9a — editorial policy is only as good as the tooling that lets someone act on it quickly.

---

## 8b. Authenticity Policy

The PRD defines abuse mitigation (rate limiting, daily lock, anomaly detection) without first defining what a *legitimate* vote is. That gap matters — without a stated principle, "is this vote valid?" gets answered ad hoc, case by case, which is exactly the inconsistency the rest of Section 8/8a is trying to avoid.

> **Guiding principle:** Rate My President measures participation within its own ecosystem, not a verified national electorate. Anyone can swipe on any leader regardless of nationality, residency, or whether they've ever heard of that leader before. Anti-abuse systems exist to preserve fair participation within the app — even distribution of influence, no single actor able to disproportionately move a number — not to verify political eligibility or credential voters.

This framing does real work beyond philosophy:

- It pre-empts the "this isn't a real poll" criticism by never having claimed to be one — consistent with the Section 2.3 non-goal and the Section 8 in-app disclaimer.
- It gives a clear answer to edge cases without new rules each time: a South African rating a leader they've never heard of, a VPN user, someone who swipes on every available leader over time — all legitimate *participation*, none of it needs to be "verified" against any real-world credential.
- It draws the actual line for what anti-abuse systems are for: **stopping disproportionate influence** (bots, multi-device farming, coordinated brigading), not **gatekeeping who's allowed an opinion**. Rate limiting and fraud detection exist to keep participation roughly even, not to check anyone's papers.
- It sets expectations for the harder future case — state-level influence operations — as a fair-participation problem to detect and mitigate at scale, not a legitimacy question to adjudicate per user.

---

## 9. Technical Architecture (Scale-Ready)

*Rationale developed with Kudzie in prior discussion — captured here for reference.*

| Layer | Choice | Purpose |
|---|---|---|
| Frontend | Next.js (React/TS) | Reuses existing React/TS familiarity; ISR for cached leaderboard pages |
| Hosting/Edge | Cloudflare Workers/Pages | Reuses existing deploy pipeline and DNS setup; global low latency |
| API | Node.js + Fastify | Lightweight JSON API, low overhead vs. Express under load |
| Primary DB | Postgres (Neon/Supabase) | Durable ledger for swipes, leaders, news links; serverless connection scaling |
| Speed layer | Redis (Upstash) — Sorted Sets | Live leaderboard ranking (O(log n) writes/reads); avoids hammering Postgres with aggregation queries under traffic spikes |
| Daily lock | Redis `SET NX EX` | Atomic per-user daily swipe enforcement, no DB round-trip |
| Async jobs | BullMQ (Redis-backed) | News refresh, leaderboard snapshotting, share-card image generation |
| Auth (v1) | None — anonymous fingerprint | Zero-friction entry matching daily-swipe casual use case |
| Auth (v2, conditional) | Clerk or Auth.js | Added once retention data justifies accounts (streak persistence across devices, etc.) |

**Write path:** every swipe writes to Postgres (ledger) and increments the Redis sorted set (speed). If Redis needs to be rebuilt, it's replayed from Postgres — no data loss, only temporary speed loss.

---

## 9a. Admin Console

Real-world political events don't wait for a deploy cycle. A leader can die, resign, get deposed, or lose an election with no warning, and the deck needs to reflect that within hours, not whenever someone next has time to write a manual SQL update.

**Minimum v1 requirement:** a lightweight internal admin panel (doesn't need to be pretty) that supports:
- Toggle a `President` record active/inactive immediately (pulls them out of deck rotation without deleting historical data)
- Edit core fields (role_title, party, term_end) without a deploy
- Add a new leader entry on short notice (snap elections, new appointments)
- Push a manual news link outside the normal weekly curation cadence, for a breaking event

This doesn't need to be built as a fully separate product — a protected internal route in the same Next.js app, gated behind a simple auth check, is sufficient for v1. The requirement is that it exists at all, not that it's sophisticated.

---

## 9b. Monetization Strategy

The core loop is deliberately low-inventory (one swipe, ~10–15 seconds of attention per user per day), which makes conventional ad-driven monetization a poor fit. The realistic path to revenue is treating the **aggregate dataset**, not the single swipe, as the asset — the swipes are the raw material, the value is in what can be done with them over time.

Candidate models, roughly in order of fit with the product's trust positioning:

| Model | Description | Trust risk | v1 Status |
|---|---|---|---|
| Research/API access | Paid API access to aggregated, anonymized sentiment data for journalists, academics, and researchers | Low — external, doesn't touch in-app experience | Deferred |
| Sponsored analytics | Media partners license deeper trend data (regional splits, movement-over-time) for reporting | Low-medium — must stay clearly separated from ranking/editorial integrity | Deferred |
| Premium stats for end users | Optional paid tier: historical charts, "time machine" views, deeper regional breakdowns | Low — doesn't change the free core loop or the fairness of rankings | Deferred |
| Corporate/brand licensing (white-label) | Same engine, reskinned for rating CEOs, brands, or public figures outside politics — a genuinely separate product line reusing this infrastructure | Low — decouples entirely from the political trust surface | Deferred |
| In-app support/tipping | "Support the project" style optional payment, no feature gating | Low — but weak revenue ceiling | **Shipping at v1** |
| Advertising | Traditional display/sponsorship inventory | Higher — political content + ads is a harder sell to advertisers and a bigger perception risk for users | Deprioritized |

**v1 stance (v0.7 decision):** no feature-gated or ad-based monetization at launch, but an **optional "support the project" tip jar ships with v1** — no feature gating, no impact on the free core loop, purely voluntary. This is the lowest-trust-risk option on the table precisely because it doesn't touch rankings, roster, or the swipe mechanic in any way. Data model and consent language (Section 8) are still written with future aggregated-data licensing in mind — e.g., being explicit in the privacy notice that anonymized, aggregate swipe data may inform research or analytics products later — so that path isn't a retroactive policy change if pursued. Advertising remains deprioritized given the trust-sensitivity of the product category.

---

## 10. Success Metrics

| Metric | Why it matters |
|---|---|
| D1/D7/D30 retention | Validates the daily-habit mechanic is actually sticky |
| Swipes per active user per day | Should trend toward ~1 (by design) — a spike suggests abuse, not engagement |
| Share-card generation rate | Primary organic growth signal |
| Outbound click-through rate on news links | Validates the "informative" half of the product is actually being used, not just the game half |
| Leaderboard page views vs. swipe count | Indicates how much value comes from passive browsing vs. active play |

---

## 11. MVP Scope (v1 Launch)

**In scope:**
1. Swipe deck — 15–25 seeded world leaders across multiple regions, with a documented editorial/inclusion policy applied to roster selection (Section 8a)
2. Server-enforced one-swipe-per-day, anonymous UUID (not fingerprinting)
3. Card flip reveal (approval %, trend, 2–3 auto-selected news headlines from approved sources — Section 6)
4. Leaderboards: Day / Week / Lowest Rated / **Region toggle** — ranked via Wilson score, not raw net (Section 5a)
5. In-app disclaimer language ("not a scientific poll") on leaderboard and card-flip surfaces
6. Anonymous session tracking, no login required
7. Share card generation (static image, "I rated [X] today")
8. Basic abuse protection (rate limiting, daily lock, obvious bot signatures)
9. Minimal internal admin console for roster edits and breaking-event updates (Section 9a)
10. Optional "support the project" tip jar — no feature gating, no impact on core loop (Section 9b)

**Explicitly deferred to v2+:**
- Accounts / cross-device streak sync
- Month/Year leaderboards beyond MVP set
- "Political Compass" personal summary
- Automated news ingestion beyond the v1 selection rules (see Section 6 for what already ships)
- Notifications/reminders
- Additional card categories (parliaments, CEOs, etc.)
- Revenue-generating monetization beyond the v1 tip jar (research API, sponsored analytics, premium tiers, white-label — Section 9b)

---

## 12. Open Questions for Kudzie — All Resolved

- ~~Disputed territories reference standard~~ **Resolved (v0.3):** UN member state list. See Section 8a.
- ~~Leader roster scope at launch~~ **Resolved (v0.4):** heads of state/government only, one per UN member state. See Section 8a.
- ~~Editorial ownership of news curation~~ **Resolved (v0.5):** no manual curation — mechanical multi-headline selection from an approved source allowlist. See Section 6.
- ~~Naming/branding risk tolerance~~ **Resolved (v0.6):** public brand stays "Rate My President." Internally, the data model and product logic remain fully role-neutral (`role_title` field already generalizes across President/PM/Chancellor/etc. — see Section 7) — the name is a marketing choice, not a scope constraint on the roster.
- ~~Monetization stance for v1~~ **Resolved (v0.7):** ad-free, optional "support the project" tip jar ships at launch, no feature gating. See Section 9b.

---

## 13. Post-MVP Roadmap (Parked, Not Blocking)

These are legitimate product-maturity ideas surfaced during review, worth tracking, but none block an MVP that's testing whether the core loop works at all:

- **Deepen the session beyond one swipe** — richer post-swipe surfaces (biggest mover, historical chart, regional comparison) to extend engagement past the single daily action without breaking the one-swipe scarcity mechanic itself
- **Source allowlist governance** — as the app gains attention, formalize how sources are added/removed from the approved list (Section 6) and how disputes about source neutrality get handled — the mechanical selection is only as trustworthy as the allowlist behind it
- **Network effects / social comparison** — surfacing "you agreed with X% of your region" or similar comparative framing to give swiping a conversational, shareable hook beyond the leaderboard alone
- **Moderation SOPs** — formal procedures for support requests, DMCA, government takedown requests, and appeals once volume justifies dedicated process over ad hoc handling
- **Incident response plan** — documented recovery steps for infrastructure failure, data integrity issues, or coordinated abuse events, once real traffic makes these probable rather than hypothetical
- **Transparency reporting** — periodic public documentation of ranking methodology changes, roster changes, and aggregate policy decisions, valuable once the product has an audience worth being accountable to

---

*End of draft (v1.0). All open questions resolved — ready for engineering breakdown into implementation phases.*
