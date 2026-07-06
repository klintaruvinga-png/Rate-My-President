# Rate My President

A daily civic ritual swipe app measuring global sentiment on world leaders.

## 🎯 Core Product Insight

> **"Tinder for presidents, but it's actually serious."**

Not a game. Not a debate platform. Not entertainment pretending to be polls. A beautifully designed **daily choice** that makes voting feel like an Apple product, not a government form.

**Product DNA:** One swipe, one leader, once per day. Mechanical leaderboard rankings. Real news links. Quiet satisfaction.

## 📚 Documentation Structure

### Strategic Docs
- **[PRODUCT.md](PRODUCT.md)** — What the product is, who uses it, why it exists. *Start here.*
- **[DESIGN.md](DESIGN.md)** — Visual system (colors, typography, motion, components).

### Implementation Docs

**Swipe Card (Daily voting experience)**
- **[SwipeCard.tsx](SwipeCard.tsx)** — React component, production-ready, 280 lines.
- **[SwipeCard.types.ts](SwipeCard.types.ts)** — TypeScript interfaces.
- **[SwipeCard.demo.tsx](SwipeCard.demo.tsx)** — Working example with mock data.
- **[COMPONENT.md](COMPONENT.md)** — Full API documentation, accessibility, responsive behavior.

**Onboarding (First-run experience)**
- **[Onboarding.tsx](Onboarding.tsx)** — React component, production-ready, 280 lines.
- **[Onboarding.types.ts](Onboarding.types.ts)** — TypeScript interfaces.
- **[Onboarding.demo.tsx](Onboarding.demo.tsx)** — Example usage with mock countries.
- **[ONBOARDING.md](ONBOARDING.md)** — Complete API documentation and design specs.
- **[ONBOARDING_INTEGRATION.md](ONBOARDING_INTEGRATION.md)** — Setup, state management, testing patterns.

**Leaderboard (Rankings & real-time updates)**
- **[Leaderboard.tsx](Leaderboard.tsx)** — React component, production-ready, 280 lines.
- **[Leaderboard.types.ts](Leaderboard.types.ts)** — TypeScript interfaces.
- **[Leaderboard.demo.tsx](Leaderboard.demo.tsx)** — Interactive demo with sortable table.
- **[LEADERBOARD.md](LEADERBOARD.md)** — Complete API documentation and design specs.
- **[LEADERBOARD_INTEGRATION.md](LEADERBOARD_INTEGRATION.md)** — Setup, backend endpoints, real-time streams.

**Shared**
- **[INTEGRATION.md](INTEGRATION.md)** — Setup, usage patterns, API design, backend endpoints.

### Reference Docs
- **[DESIGN.md](DESIGN.md)** — Design system (copy the philosophy, not the specs).
- **[AGENTS.md](AGENTS.md)** — AI agent guide for this workspace.
- **[SHIPPED.md](SHIPPED.md)** — What was delivered and why.

## 🚀 Quick Start

### For Product Managers / Designers
1. Read **[PRODUCT.md](PRODUCT.md)** (philosophy)
2. Skim **[DESIGN.md](DESIGN.md)** (visual direction)
3. Review **[SHIPPED.md](SHIPPED.md)** (what's done, what's next)

### For Engineers
1. Read **[INTEGRATION.md](INTEGRATION.md)** (setup)
2. Import `SwipeCard` from **[SwipeCard.tsx](SwipeCard.tsx)** (daily voting)
3. Import `Onboarding` from **[Onboarding.tsx](Onboarding.tsx)** (first-run)
4. Import `Leaderboard` from **[Leaderboard.tsx](Leaderboard.tsx)** (rankings)
5. Reference **[COMPONENT.md](COMPONENT.md)** for SwipeCard API
6. Reference **[ONBOARDING_INTEGRATION.md](ONBOARDING_INTEGRATION.md)** for onboarding setup
7. Reference **[LEADERBOARD_INTEGRATION.md](LEADERBOARD_INTEGRATION.md)** for leaderboard setup
8. Study the demo components for usage examples

### For Designers
1. Copy color values from **[DESIGN.md](DESIGN.md)** into your design tool
2. Use **[tailwind.config.js](tailwind.config.js)** as source of truth
3. Reference **[AGENTS.md](AGENTS.md)** under "Design Context"

## 🎨 Design Philosophy

**Not:** Gamified, playful, entertaining
**Is:** Calm, intentional, meaningful

**The moment:** Users spend 15–20 seconds voting on two leaders. The interaction should feel clean, confident, and satisfying—like voting at a beautifully designed polling place, or using Apple News.

**The guardrail:** Every element must justify breaking the silence. No confetti, badges, streaks, or celebration sounds.

## 🔧 Key Technologies

- **React** + TypeScript (components)
- **Tailwind CSS** (styling, OKLCH colors)
- **Web APIs** (swipe/touch events, haptic feedback)

## 📦 What's Included

| File | Lines | Purpose |
|------|-------|---------|
| **SwipeCard** | | |
| SwipeCard.tsx | ~280 | Main voting component (gesture, buttons, results) |
| SwipeCard.types.ts | ~120 | TypeScript interfaces |
| SwipeCard.demo.tsx | ~70 | Example usage |
| COMPONENT.md | ~400 | SwipeCard API docs, accessibility |
| **Onboarding** | | |
| Onboarding.tsx | ~280 | First-run experience (mechanic, country selection) |
| Onboarding.types.ts | ~50 | TypeScript interfaces |
| Onboarding.demo.tsx | ~60 | Example usage |
| ONBOARDING.md | ~350 | Onboarding API docs, design specs |
| ONBOARDING_INTEGRATION.md | ~400 | Setup, state management, testing |
| **Leaderboard** | | |
| Leaderboard.tsx | ~280 | Rankings & real-time updates (sortable table) |
| Leaderboard.types.ts | ~70 | TypeScript interfaces |
| Leaderboard.demo.tsx | ~120 | Interactive demo with mock data |
| LEADERBOARD.md | ~450 | Leaderboard API docs, design specs |
| LEADERBOARD_INTEGRATION.md | ~450 | Setup, backend endpoints, WebSocket streams |
| **System** | | |
| tailwind.config.js | ~80 | Design tokens, animations, fonts |
| INTEGRATION.md | ~450 | Setup, usage patterns, backend endpoints |
| SHIPPED.md | ~300 | Philosophy, shipping checklist |

**Total:** ~4,300 lines of docs + code, zero external dependencies beyond React + Tailwind.

## ✨ Features

### SwipeCard
- ✅ Swipe gesture (drag left/right, visual feedback)
- ✅ Buttons + keyboard (fallback inputs)
- ✅ Results reveal (staggered animation)
- ✅ Micro-history ("Yesterday: Approve ✓")
- ✅ Accessibility (WCAG 2.1 AA)
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Haptic feedback (on mobile swipe release)
- ✅ TypeScript types (full coverage)

### Onboarding
- ✅ 6-screen mechanic walkthrough
- ✅ Searchable country selection with geolocation
- ✅ Explicit skip option (no dark patterns)
- ✅ Back navigation throughout
- ✅ Responsive & accessible
- ✅ Auto-advance to first swipe

### Leaderboard
- ✅ Three time windows (Today, This Week, All-Time)
- ✅ Real-time row updates
- ✅ Sortable columns (Rank, Approval %, Vote Count)
- ✅ Responsive design (hides columns on mobile)
- ✅ Full state coverage (loading, error, empty)
- ✅ Keyboard navigation & screen reader support

## 🛣️ Phase 2 Roadmap

**Phase 1 ✅ (Shipped)**
- SwipeCard component (gesture + buttons + results)
- Onboarding component (mechanic explainer + country selection)
- Leaderboard component (real-time rankings, sortable, responsive)
- Design system (OKLCH colors, typography, animations)
- Documentation (PRODUCT.md, DESIGN.md, COMPONENT.md, etc.)

**Phase 2 (Next)**
- **Backend API:** Authentication, vote storage, daily reset, card rotation
- **Real-time streaming:** WebSocket or polling for live leaderboard updates
- **Advanced leaderboards:** Regional filters, historical trends, share cards
- **Analytics:** Retention, engagement, voting patterns

**Phase 3 (Future)**
- Community features: Social sharing, regional competitions
- Localization: Multi-language UI copy
- Mobile app: Native iOS/Android (React Native or Flutter)

## 📄 License

MIT License — See LICENSE file for details.

---

**Ready to ship!** 🚀

Start with [PRODUCT.md](PRODUCT.md) to understand the vision, then [INTEGRATION.md](INTEGRATION.md) to begin implementation.
