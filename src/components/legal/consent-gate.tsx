"use client";

import * as React from "react";
import { Barbell, FirstAidKit, Heartbeat, ShieldCheck, Warning } from "@phosphor-icons/react/dist/ssr";
import { useAuth } from "@/lib/auth/auth-provider";
import { hasAcceptedCurrentTerms, legalConsentStore, recordAcceptance } from "@/lib/auth/legal-consent";
import { ConsentFields, NO_CONSENT, hasFullConsent } from "@/components/legal/consent-fields";
import { Button } from "@/components/ui/button";

const POINTS = [
  {
    icon: FirstAidKit,
    title: "Not medical advice",
    body: "Fits is a training log. Check with a doctor before starting a new exercise program, especially if you have a health condition, an injury, or are pregnant.",
  },
  {
    icon: Warning,
    title: "Train at your own risk",
    body: "Lifting carries a real risk of injury. Use good form, safety equipment, and a spotter, and stop if something hurts. Programs and suggested weights are general examples, not personalized coaching.",
  },
  {
    icon: Heartbeat,
    title: "Estimates are estimates",
    body: "Estimated 1RMs and strength percentiles are rough comparisons against community data, not a measure of your health or fitness.",
  },
  {
    icon: ShieldCheck,
    title: "Your data stays yours",
    body: "We never sell your data or use it for ads, and you can export or delete it at any time from Profile.",
  },
];

/** Hook for the gate's decision, shared so AuthGate can decide whether to render it at all. */
export function useNeedsConsent() {
  const { user } = useAuth();
  const identity = user?.id ?? "guest";
  const localVersion = React.useSyncExternalStore(
    legalConsentStore.subscribe,
    () => legalConsentStore.getSnapshot(identity),
    () => null
  );
  return !hasAcceptedCurrentTerms(user, localVersion);
}

/**
 * One-time (per Terms version) agreement screen shown before the app itself, for anyone who
 * hasn't agreed to the current Terms yet: guests on first launch, accounts created before the
 * Terms existed, and everyone again after LEGAL_VERSION is bumped. Sign-up collects the same
 * agreement inline, so new accounts never see this.
 */
export function ConsentGate() {
  const { supabase, user, isGuest, leaveGuestMode, signOut } = useAuth();
  const [consent, setConsent] = React.useState(NO_CONSENT);
  const [saving, setSaving] = React.useState(false);

  async function handleAgree() {
    setSaving(true);
    await recordAcceptance(supabase, user);
    setSaving(false);
  }

  function handleDecline() {
    if (isGuest) leaveGuestMode();
    else void signOut();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[calc(2.5rem+env(safe-area-inset-top))]">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Barbell size={22} weight="fill" className="text-primary" />
          <span className="font-display text-2xl font-bold tracking-tight">Fits</span>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h1 className="font-display text-2xl font-bold tracking-tight">Before you start</h1>
          <p className="mt-1 text-sm text-muted-foreground">A few things to know and agree to.</p>

          <ul className="mt-5 space-y-4">
            {POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <Icon size={20} weight="duotone" className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-border pt-5">
            <ConsentFields value={consent} onChange={setConsent} idPrefix="gate" />
          </div>

          <Button
            size="lg"
            className="mt-6 h-11 w-full"
            disabled={!hasFullConsent(consent) || saving}
            onClick={() => void handleAgree()}
          >
            Agree and continue
          </Button>
          <Button variant="ghost" size="lg" className="mt-2 h-11 w-full text-muted-foreground" onClick={handleDecline}>
            {isGuest ? "Not now" : "Log out"}
          </Button>
        </div>
      </div>
    </div>
  );
}
