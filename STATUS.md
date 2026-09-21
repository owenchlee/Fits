# iOS App Store Prep — Status

Branch: `ios-app-store-prep`
Started: 2026-09-20

This file is the resume point for this work. If you're picking this up again, read the whole thing before doing anything — especially "Open concerns" at the bottom.

## ⚠️ PAUSED — concurrent session collision detected (2026-09-21)

Mid-way through Phase 2, I detected that another live Claude Code session (peer session name `fits-90` on this machine) is editing files in this **exact same working directory** (not a separate git worktree) — same repo path, same branch (`ios-app-store-prep`), apparently working the same task. Evidence: `git status`/`git diff` showed changes I never made appearing in my working tree mid-session (a `hit-slop-44` CSS utility added to `src/app/globals.css`, and a matching touch-target fix in `src/components/ui/dialog.tsx`) — these match the exact fix I was independently in the middle of applying to other files by hand (inline `before:inset-[-Npx]` hit-slop on icon buttons).

I sent `fits-90` a message via SendMessage flagging the collision and asking whether it's actively editing right now, and paused my own file edits to avoid a race (two processes writing the same files at the same time can silently drop or corrupt each other's changes). **I have not committed anything yet on this branch.**

**If you are resuming this work:** check `git status`/`git diff` first to see the actual current state of the tree (it may reflect a mix of both sessions' edits, potentially inconsistent — e.g. some icon buttons fixed via my inline `before:` classes, others via the `hit-slop-44` utility class the other session introduced). Reconcile to one consistent approach (prefer `hit-slop-44` since it's the cleaner, already-named utility, and there's a decent chance more of the codebase already uses it than I know about) before committing. Confirm no other Claude Code session is still writing to this same directory before proceeding.

## Phase 0 — Assessment (DONE)

Capacitor is **already fully set up** in this repo — this was not a greenfield task:

- `ios/` and `android/` native projects exist and are populated (Xcode project, `Info.plist`, `Assets.xcassets` with an existing `AppIcon-512@2x.png`, Android Gradle project).
- `@capacitor/android`, `@capacitor/app`, `@capacitor/cli`, `@capacitor/core`, `@capacitor/ios`, `@capacitor/preferences`, `@capacitor/splash-screen`, `@capacitor/status-bar` are all in `package.json` dependencies (v8.x).
- Root `capacitor.config.ts` is configured with `appId: com.owenlee.fits`, `appName: Fits`.
- `src/components/capacitor-init.tsx` wires native StatusBar/SplashScreen/Android back-button behavior via `Capacitor.isNativePlatform()`.
- `src/lib/supabase/client.ts` swaps in a `Preferences`-backed auth storage adapter when running natively.
- README.md documents `npx cap sync` as part of the existing workflow.

**Important architectural finding:** `capacitor.config.ts` configures a **remote-URL wrapper**, not a bundled static app:

```ts
server: {
  url: "https://fits-app-owenl1-cc3d.vercel.app",
  cleartext: false,
},
```

`webDir: "public"` is an explicit dummy fallback (there's a comment in the file explaining Next's middleware/SSR usage — now `src/proxy.ts`, Next 16's renamed middleware convention — is why the app can't be statically exported). The native shell loads the live Vercel deployment directly rather than bundling web assets.

**This changes the plan:** Phase 1 (Capacitor setup) from the original task brief is already done and does not need to be repeated. However, this remote-loading architecture is a real App Store review risk under **Guideline 4.2 (Minimum Functionality)** — Apple has rejected/scrutinized apps that are thin wrappers around a remote website with no native-specific value beyond a WebView. This is flagged as an open concern below, not something to silently fix — it's a product/architecture decision, not a bug.

Proceeding directly to Phase 2 (iOS UI audit).

## Phase 1 — Capacitor setup

Skipped — already done (see Phase 0 notes). No action taken.

## Phase 2 — iOS UI audit

Status: IN PROGRESS

Findings from codebase audit (Next.js App Router, `src/app/`, Tailwind v4, shadcn/ui):

### Safe area insets
- `env(safe-area-inset-*)` is already used in 4 places: `src/components/layout/bottom-nav.tsx`, `src/components/layout/app-shell.tsx`, `src/components/train/active-workout-bar.tsx`, `src/components/timer/rest-timer-bar.tsx`.
- **Bug found:** none of it currently works. `src/app/layout.tsx`'s `viewport` export has no `viewportFit: "cover"`, so Next emits a viewport meta tag without `viewport-fit=cover`. Without that, iOS resolves all `env(safe-area-inset-*)` to `0px`. The `appleWebApp: { statusBarStyle: "black-translucent" }` config already present shows the intent was there for edge-to-edge, it just never got the viewport-fit piece.
- Fix: add `viewportFit: "cover"` to the `Viewport` export in `src/app/layout.tsx`.
- Dialogs/sheets/popovers (`src/components/ui/dialog.tsx`, `sheet.tsx`, `popover.tsx`) have no safe-area padding at all — lower priority since they're centered/anchored, not edge-pinned, but worth a look if any full-screen sheet is added later.

### Touch targets (44×44pt minimum)
Icon-only buttons are consistently undersized. Tailwind size variants in `src/components/ui/button.tsx`: `icon-xs` (24px), `icon-sm` (28px), `icon` (32px), `icon-lg` (36px) — none reach 44px. Concrete offenders:
- `src/components/ui/dialog.tsx` close (X) button — `icon-sm` (28px)
- `src/components/programs/program-builder-dialog.tsx` — two remove-exercise controls at `size-7` (28px)
- `src/components/shared/exercise-picker.tsx` — back button `size-7`, clear button `size-6`
- `src/components/train/exercise-session-card.tsx` — remove-exercise button `size-7`
- `src/components/train/plate-calculator-popover.tsx` — trigger `size-8` (32px)
- `src/components/layout/bottom-nav.tsx` — nav icon bubble `size-8`, though the surrounding `<Link>` padding likely extends the real tappable area (needs visual confirmation, not just source read)

Approach: rather than visually enlarging every icon (would blow up the compact design), add invisible hit-slop via a pseudo-element so the visual size stays the same but the tap target reaches 44×44.

**Done.** While applying this, discovered mid-session that another live Claude Code session (`fits-90`) was concurrently editing this same working directory on the same task and had already introduced a `hit-slop-44` CSS utility (`src/app/globals.css`) plus applied it to the dialog close button. See "⚠️ Concurrent session collision" note at the top of this file for the full story. Reconciled by adopting that same `hit-slop-44` utility everywhere instead of my own ad-hoc per-component inset values, so the codebase ends up with one consistent pattern:

- `src/components/ui/button.tsx` — added `hit-slop-44` to all icon-size variants (`icon`, `icon-xs`, `icon-sm`, `icon-lg`) at the shared component level, so every button using these sizes anywhere in the app is fixed at once (this also covers the dialog close button `fits-90` fixed by hand — now redundant but harmless).
- `src/components/programs/program-builder-dialog.tsx` (2 raw `<button>`s), `src/components/shared/exercise-picker.tsx` (2), `src/components/train/exercise-session-card.tsx` (1), `src/components/train/plate-calculator-popover.tsx` (1) — these don't use the shared `Button` component, so `hit-slop-44` (plus `relative`) was added directly to each.
- `src/components/layout/bottom-nav.tsx` — checked, not changed: the icon bubble is `size-8` but sits inside a `<Link>` that fills its full grid cell (~90×44px+), so the real tappable area is already adequate.

Known trade-off: `hit-slop-44` centers an invisible 44×44 box regardless of the element's visual size, so on tightly-packed rows (e.g. the exercise-picker info button next to the exercise name button) the expanded hit areas can slightly overlap a neighboring control. Judged an acceptable trade-off for meeting Apple's HIG minimum; flagging here rather than silently deciding it's fine — worth a quick on-device tap test once there's a build to test with.

### Hover-only tooltip — fixed
`src/components/percentile/lift-percentile-row.tsx` — the tooltip trigger was a plain `<span>` with no independent focus/tap semantics. Changed it to a real `<button type="button">` with the same visual styling plus `hit-slop-44`, so it's keyboard-focusable and has a real tap target. Radix's Tooltip primitive already has built-in touch/pointer handling; this fix makes the trigger a proper interactive element on top of that. Not verified on an actual device/simulator — flagging that as a manual check once a Mac/Xcode environment is available.

### Text-selection / callout — fixed
Added a base-layer rule in `src/app/globals.css`: `button, [role="button"], svg, nav { -webkit-touch-callout: none; }`. Covers all interactive controls and icons app-wide without touching per-component code. Did not add blanket `user-select: none` beyond what shadcn/ui primitives already set — actual text content (workout notes, numbers) should stay selectable.

### Browser-only behavior — no changes needed
Confirmed via audit: no `router.back()`, no `beforeunload`, no UI copy about "back button"/"URL bar". `window.location.origin` usage in `reset-password/page.tsx` is fine given the remote-URL Capacitor architecture (see Phase 0) — flagged, not changed, since "fixing" it would mean guessing at a different architecture.

### Verification
`npm run build` succeeds with all Phase 2 changes (log: `.logs/phase2-build.log`, gitignored). `npm run lint` has 2 pre-existing errors in `src/app/history/[id]/page.tsx` (React "setState in effect" rule) — confirmed via `git log`/`git status` this file was not touched by this session and the errors predate this work; out of scope for an iOS audit, not fixed here. No UI was visually tested in a browser or simulator this session (no Mac/Xcode available) — flagging that as a real gap, not a claim of full verification.

Committed as: "iOS UI audit: safe-area viewport-fit, 44pt touch targets, tap-friendly tooltip, touch-callout suppression"

### Hover-only interactions
- One real gap: `src/components/percentile/lift-percentile-row.tsx` uses a Radix `Tooltip` on an inline `<span>` with no tap fallback. On iOS WKWebView, Radix tooltips generally do open on focus/tap for touch, but this needs an explicit tap-to-toggle affordance since the trigger is a plain `<span>`, not a button, and there's no visible focus mechanism for touch. Fix: wrap trigger in a real button and confirm it also opens on tap.
- No other hover-gated functionality found — all other `:hover` CSS is decorative/additive on top of tap-triggered elements (buttons already have `active:translate-y-px` press states).

### Text-selection / callout
- No `-webkit-touch-callout: none` anywhere. Candidates to add it: plate-calculator numbers, set-row numeric inputs/steppers, rest-timer bar, drag handles — anywhere a long-press callout menu would feel out of place in a native app.
- `select-none` is already used inside shadcn/ui primitives but not applied deliberately at the app-shell level for non-text UI chrome (nav bar, buttons chrome, etc.).

### Browser-only behavior
- Good news: no `router.back()`, no `beforeunload`, no UI copy referencing "back button"/"URL bar". All navigation goes through `router.push`/`router.replace`.
- `src/components/capacitor-init.tsx` already handles the Android hardware back button explicitly (`window.history.back()` / `App.exitApp()`) — this is Android-only behavior (iOS has no hardware back button), no changes needed there for iOS.
- **Flagged, not silently changed:** `src/app/reset-password/page.tsx` uses `window.location.origin` to build a Supabase magic-link redirect URL. Inside the Capacitor iOS wrapper (remote-URL mode), `window.location.origin` will be `https://fits-app-owenl1-cc3d.vercel.app` (same as the web app, since this is a remote-loaded page, not a bundled one) — so this should actually work fine as-is given the remote-URL architecture. No fix needed, but noting the reasoning here in case the architecture changes later (e.g. if the app ever moves to bundled/static assets, this would break and need `Capacitor.isNativePlatform()` handling).

## Phase 3 — Offline audit

Status: IN PROGRESS

### Biggest finding: this is not actually usable offline on first run

`src/components/auth-gate.tsx` blocks the entire app behind a Supabase session — every route except `/login`, `/signup`, `/reset-password(/confirm)` force-redirects to `/login` if there's no authenticated user. There is **no guest/local-only mode**. So despite the app's local-first Dexie (IndexedDB) data layer and its own marketing copy ("An offline-first training log..."), a fresh install with no network cannot be used at all — the user can't even get past login to reach the local data layer.

- A device that has logged in before can likely still pass `AuthGate` offline, since the Supabase session is persisted via `@capacitor/preferences` (native storage) and read locally rather than requiring a live call every time.
- A fresh install, a logged-out state, or a cleared-preferences state has a hard network dependency to do anything, contradicting the "local-first"/"offline-first" framing.

**This is a product/architecture decision, not something this session is changing.** Adding a guest mode would be a real feature, not an audit fix. Flagging it clearly here per the task instructions ("if unsure, stop and log the concern"). Recommend the developer decide: (a) ship as-is and adjust marketing copy to not claim offline-first for first-run, or (b) add a local-only guest mode before wider release. Not fixed in this session.

### Compounding architecture risk

Because `capacitor.config.ts` loads the live Vercel URL remotely (`server.url`, see Phase 0) rather than bundling static assets, a **fresh install with zero network on first launch may fail to load the WebView content at all** — independent of the local data layer. The registered service worker (`public/sw.js`) caches the app shell and static assets network-first/cache-fallback, but only after a first successful load. Also flagged, not fixed — same reasoning as the Phase 0 remote-wrapper concern.

### Concrete bugs fixed this phase (safe, mechanical fixes — not product decisions)

1. **`src/lib/sync/migrate-local-data.ts` / `src/app/signup/page.tsx`** — `handleMigrate` had no try/catch around the migration+flush call. If it throws instead of resolving, `setMigrating(false)` never runs and the dialog shows a stuck spinner forever. Fixed: wrapped in try/catch/finally so the spinner always clears and a failure surfaces a toast instead of hanging silently.
2. **Auth pages (`login`, `signup`, `reset-password`, `reset-password/confirm`)** — `await supabase.auth.X(...)` calls were not wrapped in try/catch. Supabase-js v2 normally returns network failures as a structured `{error}` rather than throwing, so this wasn't an infinite-spinner risk, but the displayed message was whatever raw string the SDK/fetch produced (e.g. "Failed to fetch"). Fixed: added a check that maps generic fetch/network-failure error messages to a friendlier "Check your internet connection and try again" message before displaying.
3. **`src/app/error.tsx` / `src/app/global-error.tsx`** — generic copy regardless of cause. Fixed: check `navigator.onLine` when the boundary catches, and show "You're offline — check your connection and try again" instead of the generic crash message when applicable, while keeping the existing generic message as fallback for genuine exceptions.
4. **`src/lib/sync/engine.ts` `pullAll`/`startSync`** — `pullAll`'s `profiles` select had no try/catch, and `startSync` is called as a fire-and-forget `void startSync(...)` with no `.catch()`, risking an unhandled promise rejection if the initial select throws (rather than resolving with `{error}`) on a flaky/offline connection. Fixed: wrapped the `profiles` select in try/catch consistent with how the per-table loop already tolerates `{error}`.

Not touched: `flushOutbox`'s existing silent catch-and-retry (reasonable for a background queue), the realtime channel's lack of reconnect UI (cosmetic, not a crash/hang risk), and the server-side `updateSession` middleware (runs on Vercel, not on-device, out of scope for a native-wrapper offline audit).

### Data/privacy inventory (for Phase 5 and 6)

- Local (Dexie/IndexedDB, always): exercises, programs, workouts, sets, bodyMetrics, settings, percentileSnapshots.
- Synced to Supabase (only when signed in): profile settings (unit system, sex, bodyweight, rest timer default, plate config, streak), custom exercises/programs, workouts, sets, body metrics, percentile snapshots — plus auth email+password via Supabase Auth.
- No analytics, crash reporting, or tracking SDKs of any kind (confirmed no Sentry/PostHog/GA/Mixpanel/Amplitude/Segment/Vercel Analytics).
- No existing privacy policy anywhere in the repo.

## Phase 4 — App icon & splash screen

Status: NOT STARTED

Note for later: an `AppIcon-512@2x.png` already exists under `ios/App/App/Assets.xcassets/AppIcon.appiconset/` and `public/icons/` already has a full webp icon set (48–512px) referenced from the PWA manifest. Brand colors (from `src/app/globals.css`, OKLCH): primary `oklch(0.8687 0.2559 128.99)` (lime/yellow-green), highlight `oklch(0.789 0.163 70.08)` (amber), app background `#0c0d0f` (near-black, used consistently in `capacitor.config.ts` and the manifest). Need to check whether the existing icon set is sufficient before generating anything new — may be a smaller task than the original brief assumed.

## Phase 5 — Privacy manifest scaffold

Status: NOT STARTED

Capacitor plugins in use (from package.json): `@capacitor/android`, `@capacitor/app`, `@capacitor/core`, `@capacitor/ios`, `@capacitor/preferences`, `@capacitor/splash-screen`, `@capacitor/status-bar`. `@capacitor/preferences` is the one most likely to require an Apple privacy-manifest reason code (UserDefaults API). Needs the offline/data-audit results before drafting.

## Phase 6 — Privacy policy draft

Status: NOT STARTED

## Open concerns (things flagged, not silently fixed)

1. **Remote-URL wrapper architecture (Guideline 4.2 risk).** The iOS app loads `https://fits-app-owenl1-cc3d.vercel.app` live rather than bundling assets. This is an intentional, already-existing architecture choice (documented in a code comment) driven by the app's use of Next.js middleware/SSR. It is not something this session is changing — it's a product/legal-risk decision for the human developer. Flagging clearly: Apple app review sometimes rejects thin WebView wrappers around a remote site under "minimum functionality." Mitigating factors already in place: native StatusBar/SplashScreen integration, native back-button handling, Capacitor Preferences-backed auth storage — these show native-specific engineering beyond a bare WebView, which helps the case, but this should be a conscious call before submission, ideally researched against current Apple review guidance closer to submission time.
2. `src/app/layout.tsx` still needs `viewportFit: "cover"` — a real, uncontroversial bug fix (see Phase 2 above), not a judgment call.

## Remaining steps requiring Apple Developer account / Xcode / human decision

(To be finalized at the end of all phases — see full summary at the bottom of this file once complete.)
