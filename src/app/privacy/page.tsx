import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Fits",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10 text-sm leading-relaxed">
      <div className="mb-6 rounded-xl border border-highlight/40 bg-highlight/10 p-4 text-xs text-highlight">
        <strong>Draft — not final.</strong> This page was generated from a code-level audit of what
        Fits actually collects and stores. It has not been reviewed by a lawyer and should not be
        published or relied on for App Store submission until it has been.
      </div>

      <h1 className="font-display text-2xl font-bold">Privacy Policy</h1>
      <p className="mt-1 text-xs text-muted-foreground">Last updated: draft, not yet published</p>

      <p className="mt-6">
        Fits is a strength-training tracker. This page describes what information Fits collects,
        how it&apos;s used, and how it&apos;s stored.
      </p>

      <h2 className="mt-6 font-display text-lg font-bold">Information we collect</h2>
      <p className="mt-2">
        Creating an account currently requires an email address and password. Once signed in, the
        training data you enter — exercises, programs, workouts, sets, body measurements, and the
        strength-percentile calculations Fits derives from them — is associated with your account
        so it can sync across your devices.
      </p>
      <p className="mt-2">
        We don&apos;t collect your name, location, contacts, photos, or any device identifiers
        beyond what&apos;s strictly needed to keep you signed in. We don&apos;t use analytics,
        advertising, or crash-reporting SDKs of any kind — nothing in Fits tracks how you use the
        app for our own purposes.
      </p>

      <h2 className="mt-6 font-display text-lg font-bold">Where your data lives</h2>
      <p className="mt-2">
        Fits is local-first: your training data is stored on your device first, and the app is
        designed to work from that local copy. If you&apos;re signed in, that data also syncs to
        our backend, hosted on{" "}
        <a href="https://supabase.com" className="text-primary underline-offset-4 hover:underline">
          Supabase
        </a>
        , so it&apos;s available on your other devices. Supabase acts purely as our infrastructure
        provider — we don&apos;t sell, share, or otherwise make your data available to any other
        third party.
      </p>

      <h2 className="mt-6 font-display text-lg font-bold">Your choices</h2>
      <p className="mt-2">
        You can permanently delete your training data — locally and from your synced account — at
        any time from Settings &gt; Reset all data. You can sign out at any time from Profile.
      </p>
      <p className="mt-2 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
        Draft-stage note, not for publication as-is: as of this audit, Fits does not yet have a
        separate flow to delete the account itself (the email/password credential), only the
        training data associated with it. Apple requires apps that support account creation to
        also support in-app account deletion. This needs to be either built before submission, or
        this section needs to describe a real deletion path (e.g. an in-app request that a person
        actually fulfills) before this policy is accurate and before the app is submitted.
      </p>

      <h2 className="mt-6 font-display text-lg font-bold">Children</h2>
      <p className="mt-2">
        Fits is not directed at children and we don&apos;t knowingly collect data from anyone
        under 13.
      </p>

      <h2 className="mt-6 font-display text-lg font-bold">Changes to this policy</h2>
      <p className="mt-2">
        If this policy changes in a way that affects how your data is handled, we&apos;ll update
        this page.
      </p>

      <h2 className="mt-6 font-display text-lg font-bold">Contact</h2>
      <p className="mt-2 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
        Draft-stage note: add a real contact email here before publishing.
      </p>
    </div>
  );
}
