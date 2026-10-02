# iOS App Store Prep — Status

Branch: `ios-app-store-prep`
Started: 2026-09-20

This file is the resume point for this work. If you're picking this up again, read the whole thing before doing anything — especially "Open concerns" at the bottom.

## ⚠️ RESOLVED — concurrent session collision detected (2026-09-21)

Update: no reply was received from `fits-90` (it stayed idle for the rest of this session), and repeated `git status` checks before every subsequent commit showed no further changes appearing from outside this session. Proceeded with the remaining phases, checking `git status` before and after every edit as a precaution, and reconciled the touch-target fix to the other session's `hit-slop-44` utility (see Phase 2). All six phases completed without further collisions. If you're reading this after both sessions have finished, it's worth a final `git log --oneline` sanity check that history looks coherent before treating this branch as done.

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

**Done.** All four fixes applied and verified with `npm run build` + `npm run lint` (logs: `.logs/phase3-build2.log`, `.logs/phase3-lint2.log`, gitignored):
- New shared helper `src/lib/auth/friendly-error.ts` (`authErrorMessage`) maps raw fetch/network-failure strings to "Check your internet connection and try again." — wired into all four auth pages (`login`, `signup`, `reset-password`, `reset-password/confirm`).
- `src/app/signup/page.tsx` `handleMigrate` now wraps the migration call in try/catch/finally so the dialog spinner always clears, with a toast explaining the data is safe locally and will sync automatically later.
- `src/lib/sync/engine.ts` `pullAll` — both the `profiles` select and the per-table select loop are now wrapped in try/catch, consistent with the graceful `{error}` handling the per-table loop already had.
- `src/lib/auth/auth-provider.tsx` — `startSync(...)` call now has `.catch(() => {})` as defense-in-depth.
- `src/app/error.tsx` / `src/app/global-error.tsx` — now check `navigator.onLine` and show "You're offline / check your connection" instead of the generic crash message when applicable. (First attempt called `setState` inside `useEffect`, which a repo ESLint rule — `react-hooks/set-state-in-effect` — flags; fixed by computing `offline` directly during render instead, since these components only mount client-side after an error already occurred.)

### Data/privacy inventory (for Phase 5 and 6)

- Local (Dexie/IndexedDB, always): exercises, programs, workouts, sets, bodyMetrics, settings, percentileSnapshots.
- Synced to Supabase (only when signed in): profile settings (unit system, sex, bodyweight, rest timer default, plate config, streak), custom exercises/programs, workouts, sets, body metrics, percentile snapshots — plus auth email+password via Supabase Auth.
- No analytics, crash reporting, or tracking SDKs of any kind (confirmed no Sentry/PostHog/GA/Mixpanel/Amplitude/Segment/Vercel Analytics).
- No existing privacy policy anywhere in the repo.

## Phase 4 — App icon & splash screen

Status: DONE — turned out to need no new asset generation at all.

Checked the actual files rather than assuming the task brief's "generate placeholders" step was still needed:

- **App icon** (`ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`): real 1024×1024 PNG, RGB with no alpha channel (verified via PNG header — colorType 2, required for App Store acceptance), showing a lime dumbbell mark on the app's dark background (`#0c0d0f`) — this is real, on-brand artwork, not a placeholder. `Contents.json` uses the modern single-entry "universal" 1024×1024 format, so Xcode derives every other required size from it automatically — nothing missing.
- **Splash screen** (`ios/App/App/Assets.xcassets/Splash.imageset/`): both the light-appearance and dark-appearance images actually referenced by `Contents.json` (`Default@{1,2,3}x~universal~anyany.png` and the `-dark` variants) show the same dark-background/lime-dumbbell branding, consistent with the icon and with the app's `defaultTheme="dark"`.
- Minor, non-blocking cleanup note: three extra files sit in the same folder (`splash-2732x2732.png`, `-1.png`, `-2.png`) that are **not referenced by `Contents.json` at all** — one of them is the generic default Capacitor/Ionic template splash (white background, blue logo mark), left over from whatever tool generated these assets. They have no effect on the shipped app since Xcode only uses what `Contents.json` lists, but they're dead weight in the repo. Did not delete them since it's outside this session's scope to guess whether they're intentionally kept as source originals — flagging for the developer to clean up or keep as they see fit.
- `public/icons/` (PWA icon set, 48–512px webp) was already complete and unrelated to the native iOS asset catalog — not touched.

No commit needed for this phase — nothing was changed.

## Phase 5 — Privacy manifest scaffold

Status: DRAFTED — needs human review before submission, see warnings below and in the file itself.

Created `ios/App/App/PrivacyInfo.xcprivacy` (full reasoning is also documented as an XML comment inside the file itself):

- **`NSPrivacyAccessedAPITypes`**: only `@capacitor/preferences` was identified as wrapping one of Apple's "required reason" API categories (`NSUserDefaults`). Used a best-guess reason code (`CA92.1` — on-device-only info) since that's how the plugin is used here (auth session storage via `src/lib/supabase/client.ts`, plus general app settings) — **this specific reason code needs a human to confirm against Apple's current approved list**, since there are several UserDefaults reason codes with subtly different meanings and getting this wrong risks App Review rejection. Did not find evidence any other installed plugin (`@capacitor/app`, `@capacitor/core`, `@capacitor/ios`, `@capacitor/splash-screen`, `@capacitor/status-bar`) touches a required-reason API, but this session couldn't do a full binary-level symbol audit — Xcode/App Store Connect's own static analysis at upload time is the real backstop here.
- **`NSPrivacyCollectedDataTypes`**: declared email address and fitness/health data (workout logs), both linked to identity, both for "app functionality" only, tracking = false — matching the Phase 3 data audit (Supabase Auth + user's own training data, no analytics/ads/third-party sharing found anywhere in the codebase). **This must match whatever gets filled into App Store Connect's separate "App Privacy" questionnaire** — that's a manual step in App Store Connect, not generated by this file, but the two need to agree or App Review will flag the mismatch.
- **Not yet done, requires Xcode**: the file exists on disk but has not been added to the Xcode project target (`project.pbxproj`'s Copy Bundle Resources build phase) — I did not hand-edit `project.pbxproj` since that's an error-prone, unsupported way to modify an Xcode project without Xcode itself actually validating the result. Whoever next opens this in Xcode needs to drag `PrivacyInfo.xcprivacy` into the App target's file list (or Xcode may auto-detect and offer to add it).

## Phase 6 — Privacy policy draft

Status: DRAFTED — needs legal review before publishing, and surfaced a real App Store blocker (see below).

- Created `src/app/privacy/page.tsx`, a plain page describing what Fits actually collects (email for
  Supabase Auth, training data synced to Supabase when signed in), where it lives (local-first on
  device + Supabase as infrastructure processor), that there's no analytics/tracking/third-party
  sharing (confirmed in Phase 3), and how to delete data (Settings > Reset all data). Marked with an
  in-page banner: "Draft — not final... has not been reviewed by a lawyer."
- Added `/privacy` to `ALWAYS_ACCESSIBLE_PATHS` in `src/components/auth-gate.tsx` so it's reachable
  without signing in (needed for App Store review and for signed-out visitors).
- Linked it from `src/components/auth/auth-card.tsx` (shows on login/signup/reset-password pages).

**Real finding while writing this, not just a copywriting detail:** Fits has a "Reset all data"
feature (`src/app/profile/page.tsx`) that deletes training data, but there is no way to delete the
*account* itself (the Supabase Auth email/password credential) — only sign out. Apple's App Store
Review Guideline 5.1.1(v) requires that any app supporting account creation also support account
deletion from within the app, not just a data wipe. **This is a likely App Store rejection risk, not
just a privacy-policy wording issue.** Did not build an account-deletion flow this session — that's
a real feature (needs a Supabase server-side/admin-privileged path to actually delete the
`auth.users` row, plus UX for the destructive confirmation) that deserves its own design and testing,
not something to improvise inside a scoped iOS-prep pass. Flagged prominently here and in the final
summary below. The privacy policy draft itself is honest about this gap rather than glossing over it.

Verified with `npm run build` + `npm run lint` (logs: `.logs/phase6-build.log`, `.logs/phase6-lint.log`).

## Open concerns (things flagged, not silently fixed)

1. **Remote-URL wrapper architecture (Guideline 4.2 risk).** The iOS app loads `https://fits-app-owenl1-cc3d.vercel.app` live rather than bundling assets. This is an intentional, already-existing architecture choice (documented in a code comment) driven by the app's use of Next.js middleware/SSR. It is not something this session is changing — it's a product/legal-risk decision for the human developer. Flagging clearly: Apple app review sometimes rejects thin WebView wrappers around a remote site under "minimum functionality." Mitigating factors already in place: native StatusBar/SplashScreen integration, native back-button handling, Capacitor Preferences-backed auth storage, native haptic feedback (added post-review, see below) — these show native-specific engineering beyond a bare WebView, which helps the case, but this should be a conscious call before submission, ideally researched against current Apple review guidance closer to submission time. Decision made: ship as-is and accept this risk rather than rearchitect for static export; a rejection here just costs a review cycle, not a resubmission ban.
2. **No offline/guest mode (Phase 3).** `AuthGate` blocks the entire app behind a Supabase sign-in with no local-only path, contradicting the app's "offline-first" framing for first-run/logged-out users. Not fixed — a real feature decision, not a bug. Decision made: not addressing before submission.
3. ~~**No in-app account deletion (Phase 6).**~~ **Fixed post-review** — see "Post-review additions" below.

## Post-review additions (after the 6-phase brief and initial human review)

- **In-app account deletion** (resolves open concern #3 / Guideline 5.1.1(v)): `src/app/api/account/delete/route.ts` calls `supabase.auth.admin.deleteUser` via a new service-role admin client (`src/lib/supabase/admin.ts`), wired to a "Delete account" control in Profile next to sign out. All user tables already `on delete cascade` from `auth.users` (`supabase/migrations/0001_init.sql`), so this fully removes cloud data too; local Dexie data is wiped and the client is signed out afterward. **Requires `SUPABASE_SERVICE_ROLE_KEY`** to be set in `.env.local` and in Vercel's project env vars — not yet done by this session, account deletion will fail with a clear error message until it is. `src/app/privacy/page.tsx` updated to describe the real flow instead of flagging the gap.
- **Native haptic feedback**, added specifically to strengthen the Guideline 4.2 "more than a bare WebView" case: a light haptic tap when a set is marked complete (`src/components/train/set-row.tsx`), and a success haptic when the rest timer finishes (`src/lib/timer/rest-timer-context.tsx`) — the latter replaces a `navigator.vibrate` call that was a **silent no-op on iOS** (WKWebView never implements the Vibration API), so this is a real behavior fix on native, not just an addition. No-ops on web/PWA via the existing `Capacitor.isNativePlatform()` lazy-import pattern. Ran `npx cap sync` to register `@capacitor/haptics` in both native projects (no CocoaPods/Mac needed — iOS plugins here resolve via Swift Package Manager).
- Both verified with `npm run build` (clean) and `npm run lint` (same 2 pre-existing, unrelated failures in `src/app/history/[id]/page.tsx` as before — not touched, not introduced by this session).

## Final summary

All six phases from the original task brief are complete. Branch `ios-app-store-prep` has 6 commits, each independently reviewed via `npm run build` + `npm run lint` before committing (logs under `.logs/`, gitignored). Nothing was pushed anywhere and no destructive git operations were used.

**What's actually done (real fixes, not placeholders):**
- Capacitor/iOS/Android native projects — already existed before this session (Phase 0).
- Safe-area viewport fix (`viewportFit: "cover"`), 44×44pt touch targets via a `hit-slop-44` utility (shared with a concurrently-working session — see collision note above), a real focusable/tappable tooltip trigger, and `-webkit-touch-callout` suppression on interactive chrome (Phase 2).
- Graceful offline/network-failure handling: friendly auth error messages, a fixed stuck-spinner bug in post-signup data migration, try/catch around the sync engine's network calls, offline-aware error boundary copy (Phase 3).
- A drafted `PrivacyInfo.xcprivacy` covering the one plugin (`@capacitor/preferences`) that touches an Apple required-reason API, plus a data-collection declaration matching actual app behavior (Phase 5).
- A drafted, honest privacy policy page at `/privacy`, linked from the auth pages and reachable without signing in (Phase 6).

**What's a placeholder / explicitly marked "not final":**
- `PrivacyInfo.xcprivacy`'s reason code (`CA92.1`) — best-guess, needs confirmation against Apple's current approved list.
- `src/app/privacy/page.tsx` — drafted from a code audit, explicitly marked as unreviewed by a lawyer, with two inline notes (account-deletion gap, missing contact email) that must be resolved before it's accurate enough to publish.
- App icon/splash — turned out to already be real, on-brand artwork, not placeholders (Phase 4 correction to the original brief's assumption).

**Remaining steps that need the Apple Developer account, Xcode, or a human decision:**
1. ~~Open the project in Xcode on a Mac; confirm it builds and runs~~ — **done, confirmed by developer** (built successfully in Xcode; not independently verified by any Claude Code session since none has Mac/Xcode access).
2. Add `PrivacyInfo.xcprivacy` to the App target in Xcode (Copy Bundle Resources) — the file exists on disk but Xcode project membership can't be safely scripted without Xcode itself. Status unconfirmed — worth checking now that the project has been opened in Xcode.
3. Confirm the `PrivacyInfo.xcprivacy` reason code(s) against Apple's current approved list, and address anything Xcode/App Store Connect's own static analysis flags at upload that this code-level audit couldn't see.
4. ~~Decide on the remote-URL wrapper architecture~~ — **decided: ship as-is**, see open concern #1.
5. ~~Decide on the no-offline/guest-mode gap~~ — **decided: not addressing before submission**, see open concern #2.
6. ~~Build an in-app account-deletion flow~~ — **done**, see "Post-review additions" above. `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local` (confirmed on disk) and **confirmed by the developer as set in Vercel and working** (deletion tested successfully) — not independently re-verified via Vercel CLI in this session (CLI token here isn't authenticated).
7. Get real legal review of `src/app/privacy/page.tsx` and fill in a real contact method.
8. Set up an actual Apple Developer account / App Store Connect listing, screenshots, App Privacy questionnaire (must match `PrivacyInfo.xcprivacy`'s declarations), and TestFlight testing — none of this was started.
9. Decide what to do with the three unreferenced leftover splash source files noted in Phase 4 (harmless but worth a cleanup pass).
10. Merge `ios-app-store-prep` into `main` once the above is resolved and the branch has been reviewed — not done automatically by this session.
