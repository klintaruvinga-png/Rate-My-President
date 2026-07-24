# Rate My President — Functional QA Audit Report

**Auditor:** Senior QA Engineer  
**Target Repository:** [klintaruvinga-png/Rate-My-President](https://github.com/klintaruvinga-png/Rate-My-President)  
**Production Site:** [https://ratemypresident.xyz](https://ratemypresident.xyz)  
**Audit Date:** 2026-07-23  
**Audit Scope:** Full User Journey (Landing Page, Onboarding, Swipe Cards, Vote Persistence, Leaderboard, Navigation, Error/Loading States, Multi-Tab, Network Conditions, Build & Deployment Configuration).

---

## Executive Summary & Root Cause Analysis

### Primary Audit Target: Root Cause of `POST /api/swipes/log` HTTP 400

#### Issue Analysis
When invoking `POST /api/swipes/log`, the server frequently returns an **HTTP 400 Bad Request** status code. Our deep code audit revealed the exact multi-layered root cause of this failure:

1. **HTTP Protocol Misuse (Business Condition vs. Validation Error):**
   In `server/src/routes/swipes.js` (lines 83–102), the Express backend uses `res.status(400)` for **both** syntax/validation errors (e.g. invalid UUID format or missing body parameters) and normal business-rule states (`"Already voted today for this card type"` or `"Daily swipe limit reached"`). Returning HTTP 400 for expected domain logic causes browsers, proxies, monitoring tools, and `fetch` client wrappers to flag normal user limit events as severe HTTP failures.

2. **Client-Side Exception Branch Skipping Status Refresh:**
   In `rate-my-president-demo/src/App.tsx` (`handleSwipe`, lines 95–109), `api.logSwipe()` throws an `ApiBusinessError` when receiving the HTTP 400 response. The `catch` block intercepts this exception and returns the reason string, but **skips calling `refreshSwipeStatus()`** (which resides inside the `try` block after `api.logSwipe()`). Because `refreshSwipeStatus()` is never executed when a 400 occurs, the client UI state (`swipeStatus.locked`) never updates to `true`. The UI remains open for swiping, trapping the user in a loop where every subsequent swipe continuously fires and fails with HTTP 400.

3. **Asynchronous Handshake & UI State Desynchronization:**
   In `rate-my-president-demo/src/SwipeCard.demo.tsx` (`handleVote`, lines 168–208), `handleVote` synchronously returns `true` to `SwipeCard.tsx` while launching an asynchronous `persist()` promise in the background. `SwipeCard.tsx`'s gesture animation immediately assumes success and transitions to the reveal screen. When the backend rejects the vote with HTTP 400, `persist()` sets a `swipeError` state, but the card is already locked in `showResults = true` without an advance mechanism or retry handler.

---

## Complete Inventory of Discovered Functional Bugs

---

### Bug 1: `POST /api/swipes/log` HTTP 400 Business-Rule Response Causes Client Locked-State Error Loop
* **Severity:** High (Root Cause Identified)
* **Steps to Reproduce:**
  1. Complete onboarding and swipe on cards until your daily swipe limit (1 or 2 swipes depending on home country) is reached.
  2. Attempt to perform an additional swipe gesture on the card stack (or swipe from a second browser tab).
  3. Observe the browser network tab and application behavior.
* **Expected Behaviour:**
  When the daily swipe limit is reached, the backend should return a clear domain status payload or the client should gracefully catch business limits, update its local swipe status (`locked: true`), and display the "Daily limit reached" overlay view without throwing uncaught console errors.
* **Actual Behaviour:**
  `POST /api/swipes/log` returns HTTP 400 with `{ allowed: false, reason: "Daily swipe limit reached" }`. The frontend API client throws an `ApiBusinessError`, jumping directly into the `catch` block in `App.tsx` and skipping `refreshSwipeStatus()`. The UI remains unlocked, and subsequent user swipes generate repeated HTTP 400 errors.
* **Root Cause:**
  - `server/src/routes/swipes.js` (lines 83–102): Uses `res.status(400)` for business limits.
  - `rate-my-president-demo/src/App.tsx` (lines 95–109): `refreshSwipeStatus()` is placed after `await api.logSwipe()`, so throwing in `logSwipe` bypasses `refreshSwipeStatus()`.
* **Suggested Fix:**
  1. Change business limit responses in `server/src/routes/swipes.js` to return `200 OK` with `{ allowed: false, reason: '...' }` (reserving 400 for actual malformed payload validations).
  2. In `App.tsx`, move `refreshSwipeStatus()` into a `finally` block or invoke it inside the `catch` block before returning the error reason.
* **Files Affected:**
  - `server/src/routes/swipes.js`
  - `rate-my-president-demo/src/App.tsx`
  - `rate-my-president-demo/src/api/client.ts`

---

### Bug 2: Results Screen Instantly Dismissed / Skipped During Swipe Stack Flow
* **Severity:** High
* **Steps to Reproduce:**
  1. Navigate to the Swipe tab.
  2. Perform an Approve, Oppose, or Skip swipe gesture on a leader card.
  3. Observe the card transition and reveal screen.
* **Expected Behaviour:**
  After swiping, the leader card should transition to the results screen showing the live approval %, approval trend, and current news headlines. The user should be able to view the results and manually tap or swipe to proceed to the next card.
* **Actual Behaviour:**
  The moment the API call resolves (~100–200ms), the queue is automatically sliced in `SwipeCard.demo.tsx`. `SwipeCard` receives a new `card.id`, resetting its internal state (`showResults = false`) before the user can read the approval percentage or news headlines. Furthermore, `SwipeCard.tsx` has no click handler attached to the `showResults` element to manually dismiss it.
* **Root Cause:**
  - `rate-my-president-demo/src/SwipeCard.demo.tsx` (line 196): Calls `setCardsQueue((prev) => prev.slice(1))` immediately inside `persist()`, unmounting the current card's results state prematurely.
  - `rate-my-president-demo/src/SwipeCard.tsx` (line 545): The `showResults` markup container lacks an `onClick` or explicit gesture event to allow manual dismissal.
* **Suggested Fix:**
  Add an `onNext?: () => void` callback prop to `SwipeCardProps`. Bind it to an `onClick` event on the `showResults` container in `SwipeCard.tsx`. In `SwipeCard.demo.tsx`, advance `cardsQueue` only when `onNext` is explicitly triggered by the user.
* **Files Affected:**
  - `rate-my-president-demo/src/SwipeCard.demo.tsx`
  - `rate-my-president-demo/src/SwipeCard.tsx`
  - `rate-my-president-demo/src/SwipeCard.types.ts`

---

### Bug 3: Network Failure / Backend 500 Leaves UI Stranded in Frozen Results Screen
* **Severity:** High
* **Steps to Reproduce:**
  1. Open the application in the browser.
  2. Disconnect your network connection or simulate a 500 response for `POST /api/swipes/log`.
  3. Perform a swipe gesture on a card.
* **Expected Behaviour:**
  If the network request fails, the swipe gesture should bounce back, the card should remain on screen, and an inline error alert/toast should prompt the user to retry.
* **Actual Behaviour:**
  `handleVote` in `SwipeCard.demo.tsx` returns `true` synchronously before the async `persist()` finishes. `SwipeCard.tsx` interprets this synchronous `true` as success and triggers the fling animation into `showResults = true`. When `persist()` subsequently fails, an error alert appears, but the card remains frozen in the results state permanently.
* **Root Cause:**
  - `rate-my-president-demo/src/SwipeCard.demo.tsx` (lines 168–208): `handleVote` returns `true` eagerly without awaiting the outcome of `persist()`.
* **Suggested Fix:**
  Refactor `handleVote` to return a `Promise<boolean>` and await `persist()`. Ensure `SwipeCard.tsx` only transitions to `showResults = true` if `onVote` resolves to `true`.
* **Files Affected:**
  - `rate-my-president-demo/src/SwipeCard.demo.tsx`
  - `rate-my-president-demo/src/SwipeCard.tsx`

---

### Bug 4: Railway Deployment Failure via Docker Build Context Mismatch
* **Severity:** High (Infrastructure / Deployment)
* **Steps to Reproduce:**
  1. Trigger a deployment of the repository to Railway using `railway.json`.
  2. Inspect the Railway build logs.
* **Expected Behaviour:**
  Railway should build the Docker image using the `server/` directory as root context, installing production dependencies from `server/package.json`.
* **Actual Behaviour:**
  `railway.json` specifies `"dockerfilePath": "server/Dockerfile"` but omits `"rootDirectory": "server"`. Railway executes the Docker build from the repository root context. `COPY package*.json ./` in `server/Dockerfile` copies root `package.json` (which lacks backend dependencies like `express` and `pg`), causing the production container build to crash.
* **Root Cause:**
  - `railway.json` (lines 3–6): Missing `"rootDirectory": "server"`.
  - `server/Dockerfile` (line 12): Relies on `package.json` relative to `server/`.
* **Suggested Fix:**
  Add `"rootDirectory": "server"` to `railway.json`.
* **Files Affected:**
  - `railway.json`

---

### Bug 5: Missing Client-Side SPA Routing & Browser Back/Forward History State
* **Severity:** Medium
* **Steps to Reproduce:**
  1. Launch the app and complete Onboarding to reach the Swipe tab.
  2. Click the **Leaderboard** tab in the navigation header.
  3. Click the browser's **Back** button.
* **Expected Behaviour:**
  The application should navigate back to the Swipe tab, updating the browser history stack.
* **Actual Behaviour:**
  The browser navigates away from `ratemypresident.xyz` entirely to whatever external page was previously open in the tab.
* **Root Cause:**
  - `rate-my-president-demo/src/App.tsx` (lines 20–26, 151–153): Tab navigation uses simple React `useState` (`activeTab`) without syncing to URL search params, hash, or the HTML5 `History` API (`pushState`/`popstate`).
* **Suggested Fix:**
  Implement URL state synchronization (e.g., updating `window.location.hash` or using a standard router like `wouter` / `react-router-dom`) so tab switches push history state.
* **Files Affected:**
  - `rate-my-president-demo/src/App.tsx`

---

### Bug 6: Multi-Tab State Desynchronization on Daily Swipe Limit
* **Severity:** Medium
* **Steps to Reproduce:**
  1. Open `https://ratemypresident.xyz` in Tab 1 and Tab 2 simultaneously.
  2. In Tab 1, swipe cards until reaching your daily swipe limit.
  3. Switch to Tab 2 and perform a swipe.
* **Expected Behaviour:**
  Tab 2 should catch the limit error from the server, refresh its swipe status, and transition to the "Daily limit reached" view.
* **Actual Behaviour:**
  Tab 2 receives HTTP 400 from `/api/swipes/log`, displays a "Vote could not be saved" toast, but retains its unlocked local state. The user remains stuck attempting swipes that continuously fail.
* **Root Cause:**
  - Shared `localStorage` changes and broadcast channel state updates are not listened to, and exception handling in `App.tsx` skips calling `refreshSwipeStatus()`.
* **Suggested Fix:**
  Add a `window.addEventListener('storage', ...)` listener to sync `swipeStatus` across open tabs when local storage changes, and ensure status refresh runs on swipe errors.
* **Files Affected:**
  - `rate-my-president-demo/src/App.tsx`
  - `rate-my-president-demo/src/swipeLockStorage.ts`

---

### Bug 7: Lack of Offline Resilience and Offline Queueing
* **Severity:** Medium
* **Steps to Reproduce:**
  1. Load the app and switch your browser to Offline mode in DevTools.
  2. Perform a swipe action on a card.
* **Expected Behaviour:**
  The application should detect offline mode, inform the user that they are offline, and optionally queue the vote locally or gracefully disable swipe interactions.
* **Actual Behaviour:**
  The application throws an unhandled `TypeError: Failed to fetch` in the console and enters a stuck results view.
* **Root Cause:**
  - `rate-my-president-demo/src/api/client.ts` (lines 109–123): `request()` does not catch network connectivity errors or check `navigator.onLine`.
* **Suggested Fix:**
  Add an `online`/`offline` status check and wrap `fetch` calls with specific network failure handling.
* **Files Affected:**
  - `rate-my-president-demo/src/api/client.ts`
  - `rate-my-president-demo/src/App.tsx`

---

### Bug 8: Missing File Path in `tsconfig.app.json` `include` Array
* **Severity:** Medium (Build Risk)
* **Steps to Reproduce:**
  1. Run `npx tsc --noEmit` inside `rate-my-president-demo`.
* **Expected Behaviour:**
  TypeScript compiles all imported dependencies cleanly.
* **Actual Behaviour:**
  `rate-my-president-demo/src/SwipeCard.demo.tsx` imports `@root/swipeLockStorage`, but `swipeLockStorage.ts` is omitted from `tsconfig.app.json`'s `include` list.
* **Root Cause:**
  - `rate-my-president-demo/tsconfig.app.json` (line 39): `"include": ["src", "vite-env.d.ts", "../AnimatedFlag.tsx", "../Icons.tsx"]` omits `../swipeLockStorage.ts`.
* **Suggested Fix:**
  Update `"include"` in `tsconfig.app.json` to include `"../swipeLockStorage.ts"` or `"../*.ts"`.
* **Files Affected:**
  - `rate-my-president-demo/tsconfig.app.json`

---

### Bug 9: Infinite "Loading stack..." Screen when Presidents API Fails
* **Severity:** Low
* **Steps to Reproduce:**
  1. Simulate an API failure or 500 error on `GET /api/presidents`.
  2. Open the application.
* **Expected Behaviour:**
  The UI displays an error state with a "Failed to load presidents" message and a retry button.
* **Actual Behaviour:**
  The UI renders a permanent "Loading stack..." message indefinitely.
* **Root Cause:**
  - `rate-my-president-demo/src/App.tsx` (lines 62–69): `loadPresidents` catches the error with `console.error` but sets no error state. `SwipeCardDemo` shows "Loading stack..." whenever `cardsQueue` is empty.
* **Suggested Fix:**
  Add a `presidentsError` state in `App.tsx` and render a fallback error banner with a retry handler in `SwipeCardDemo`.
* **Files Affected:**
  - `rate-my-president-demo/src/App.tsx`
  - `rate-my-president-demo/src/SwipeCard.demo.tsx`

---

### Bug 10: React Version Mismatch & Invalid TypeScript Dependency Specifier
* **Severity:** Low (Maintenance / Environment)
* **Steps to Reproduce:**
  1. Inspect root `package.json` vs `rate-my-president-demo/package.json`.
* **Expected Behaviour:**
  Package dependencies across workspace layers should use valid version strings and compatible type definitions.
* **Actual Behaviour:**
  - `rate-my-president-demo/package.json` specifies `"typescript": "~6.0.2"` (TypeScript 6.0 does not exist; current major version is 5.x).
  - Demo `package.json` specifies `react: ^19.2.7` while root `package.json` specifies `@types/react: ^18.3.0`.
* **Root Cause:**
  - `rate-my-president-demo/package.json` (line 27) and root `package.json` (lines 7–8).
* **Suggested Fix:**
  Update `"typescript"` in demo `package.json` to `"^5.4.0"` and align root React types with React 19.
* **Files Affected:**
  - `package.json`
  - `rate-my-president-demo/package.json`

---

## Verification & Audit Summary Matrix

| Audit Area | Functional Status | Key Findings |
|---|---|---|
| **Landing & Onboarding** | Pass | Onboarding flow saves country preference and registers user UUID cleanly. |
| **Swipe Cards & Gestures** | Fail | Results screen auto-dismisses immediately; network failures leave card frozen. |
| **API & Vote Logging** | Fail | `POST /api/swipes/log` returns 400 for daily limits, causing client status refresh skip. |
| **Session & Storage** | Pass | Local UUID v4 storage (`rmp_user_id`) persists correctly across sessions. |
| **Leaderboard** | Pass | Calculates Wilson score lower bound and displays aggregate approval rates correctly. |
| **Browser Navigation** | Fail | Tab switches do not push browser history state (Back button exits site). |
| **Multi-Tab Sync** | Fail | Hitting vote limit in Tab 1 does not trigger locked state update in Tab 2. |
| **Offline / Slow Network** | Fail | Unhandled fetch exceptions occur when network is disconnected. |
| **Build & Deployment** | Fail | `railway.json` lacks `"rootDirectory": "server"`, breaking Docker context. |
