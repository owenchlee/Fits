# Fits — App Store launch checklist

Everything code can do is done on `ios-app-store-prep`. This file is what's left for a human, plus copy-paste
answers for App Store Connect. Not legal advice — the legal pages were drafted from a code audit and current
(Oct 2026) guidance; a lawyer review before launch is still cheap insurance.

## 1. Must do before submitting (blockers)

- [ ] **Fill in `src/lib/legal.ts`:**
  - `CONTACT_EMAIL` — currently a placeholder (`support@fits-app.example`). Use a real inbox you check; it's
    printed in the Privacy Policy, Terms, Health Data Policy and Support page, and privacy laws require you to
    answer requests sent there (30–45 days).
  - `GOVERNING_LAW` / `PUBLISHER_NAME` — done (Ontario, Canada; Owen Lee). Update both if you later incorporate.
- [ ] **Deploy to Vercel.** The iOS app loads the live site (`server.url` in `capacitor.config.ts`), so none of
  the web changes reach the app until the branch is deployed to production.
- [ ] **Apply Supabase migration `supabase/migrations/0004_purge_deleted_rows.sql`** (SQL editor). Enable the
  `pg_cron` extension first if the script can't. The Privacy Policy promises deleted items are purged within 30
  days — this is what makes that true.
- [ ] **Rebuild in Xcode** (new native plugins: Filesystem, Share). Run `npx cap sync ios` first on the Mac.
  Confirm `PrivacyInfo.xcprivacy` shows under App > Copy Bundle Resources (added via project.pbxproj; Xcode
  hasn't opened it yet).
- [ ] **Test on a device:** continue as guest → accept → log a workout → export (share sheet should appear) →
  create account (workout should carry over) → log out (device clears) → log in (data returns) → Delete
  account (must succeed — it used to 401 on iOS).

## 2. Decide (flagged, not changed)

- **Texas App Store Accountability Act (SB 2420)** — enforceable since June 4, 2026 after the Fifth Circuit
  stayed the injunction. Apple asks developers to adopt the Declared Age Range API, the PermissionKit
  Significant Change API, and the StoreKit age-rating property for Texas accounts. These are native Swift APIs
  (iOS 26.2+) that need a small custom Capacitor plugin and a Mac to build/test, so nothing was written blind.
  Fits has no IAP and no user-to-user content, which keeps exposure low, but the law has a $10k/violation
  penalty and doesn't clearly exempt general-audience apps. Options: (a) implement the plugin before launch,
  (b) launch, then add it in 1.0.1, (c) ask a lawyer. Sources: Apple's
  [Update for apps distributed in Texas](https://developer.apple.com/news/?id=sg176nne).
- **iPad.** `TARGETED_DEVICE_FAMILY = "1,2"` means App Store Connect requires 13" iPad screenshots and review
  will test on iPad. The layout does work at iPad width (sidebar). Switch to iPhone-only ("1") in Xcode if
  you'd rather skip iPad.
- **Guest mode** was added this session even though STATUS.md previously recorded "no guest mode before
  submission": forcing sign-up for an on-device workout log is a common Guideline 5.1.1 rejection
  ("Apps may not require users to enter personal information to function, except when directly relevant to the
  core functionality"). It's one self-contained commit (`06a9011`) if you want it out.

## 3. App Store Connect answers

**App Privacy (must match `ios/App/App/PrivacyInfo.xcprivacy`):** "Yes, we collect data."

| Data type | Linked to user | Tracking | Purpose |
| --- | --- | --- | --- |
| Contact Info → Email Address | Yes | No | App Functionality |
| Identifiers → User ID | Yes | No | App Functionality |
| Health & Fitness → Health | Yes | No | App Functionality |
| Health & Fitness → Fitness | Yes | No | App Functionality |
| User Content → Other User Content | Yes | No | App Functionality |

No Diagnostics, Usage Data, Location, or anything else — Fits has no analytics or crash SDKs.

**Privacy Policy URL:** `https://<your-domain>/privacy` · **Support URL:** `https://<your-domain>/support`

**Age rating questionnaire:** no to everything (no violence, sexual content, gambling, user-generated content
shared with others, web browsing, etc.). "Medical or treatment information": **No** — Fits gives general
fitness information with a doctor disclaimer, not medical treatment. Expected rating: 4+ (Apple's lowest). The
Terms still require users to be 13+.

**Export compliance:** handled — `ITSAppUsesNonExemptEncryption = NO` (HTTPS only).

**Category:** Health & Fitness.

**App Review notes (paste and fill in):**

> Fits works fully without an account: on the first screen tap "Continue without an account", accept the
> terms, and everything is stored on the device. To review sync and account features, sign in with the demo
> account below. Account deletion: Profile > Account > Delete account. Data export: Profile > Your data >
> Export as JSON (opens the share sheet).
>
> Demo account: <email> / <password>

Create the demo account yourself and put a few workouts in it — reviewers reject apps that look empty.

**Suggested description:**

> Fits is a fast, no-nonsense strength training log.
>
> • Log sets in seconds: weight, reps, RPE, warm-ups, drop sets and failure sets, with your last session shown
> right next to each set.
> • Smart rest timer that keeps counting while your phone is locked, with haptics when it's time to lift.
> • Follow built-in templates (Linear 5×5, Push/Pull/Legs, 3-Tier Linear Progression, 4-Day Wave Strength) or
> build your own program and weekly cycle.
> • Track estimated 1RMs, weekly volume, bodyweight and body measurements over time.
> • See how your squat, bench, deadlift and overhead press compare with community strength standards.
> • Works offline and without an account. Create one to back up and sync across devices.
> • No ads. No tracking. Export or delete your data any time.
>
> Fits is not medical advice. Check with a doctor before starting a new training program.

Avoid naming StrongLifts, 5/3/1, Wendler, GZCL, Strong, Hevy, or strengthlevel.com in the listing, keywords,
or screenshots (Guideline 5.2.1 / trademark risk).

## 4. What changed for compliance this session (for reference)

- Final Privacy Policy, new Terms of Use (medical disclaimer, assumption of risk, liability cap, Apple's
  required EULA terms), Washington/Nevada Consumer Health Data Policy, Support page, open-source licenses page.
- Clickwrap: sign-up checkboxes + one-time consent screen for guests/existing users, with a separate
  health-data consent (MHMDA requires consent separate from general terms). Bump `LEGAL_VERSION` in
  `src/lib/legal.ts` whenever the Terms or Privacy Policy materially change — everyone is re-asked.
- Renamed trademarked built-in programs; non-affiliation note on strength-standard sources.
- Account deletion works on iOS; logout wipes the device; Reset/Delete cover every table; deleted rows purge
  after 30 days.
- Privacy manifest corrected and added to the app target.
