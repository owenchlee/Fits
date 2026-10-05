"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleNotch, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { useAuth } from "@/lib/auth/auth-provider";
import { authErrorMessage } from "@/lib/auth/friendly-error";
import { acceptanceMetadata, markAcceptedLocally } from "@/lib/auth/legal-consent";
import { hasLocalDataToMigrate, migrateLocalDataToAccount } from "@/lib/sync/migrate-local-data";
import { AuthCard } from "@/components/auth/auth-card";
import { ConsentFields, NO_CONSENT, hasFullConsent } from "@/components/legal/consent-fields";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const { supabase, isGuest } = useAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [consent, setConsent] = React.useState(NO_CONSENT);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [checkEmail, setCheckEmail] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!hasFullConsent(consent)) {
      setError("Please review and agree to both items below to create an account.");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // The agreement made on this form, recorded on the account so no device asks again.
      options: { data: acceptanceMetadata() },
    });
    if (error) {
      setSubmitting(false);
      setError(authErrorMessage(error));
      return;
    }
    if (data.user) markAcceptedLocally(data.user.id);

    if (!data.session || !data.user) {
      setSubmitting(false);
      setCheckEmail(true);
      return;
    }

    // Anything already logged on this device (as a guest, or from before accounts existed) moves
    // into the new account. The sync outbox would push most of it anyway; this makes it complete.
    if (await hasLocalDataToMigrate()) {
      try {
        await migrateLocalDataToAccount(supabase, data.user.id);
        toast.success("Account created — your workouts are backed up");
      } catch {
        toast.success("Account created", {
          description: "Your workouts are safe on this device and will back up automatically once you're online.",
        });
      }
    } else {
      toast.success("Account created");
    }
    setSubmitting(false);
    router.replace("/");
  }

  if (checkEmail) {
    return (
      <AuthCard title="Check your email" description="">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <EnvelopeSimple size={32} className="text-primary" />
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to <span className="text-foreground">{email}</span>. Click it to finish
            creating your account, then come back and log in.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/login">Back to log in</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      description={
        isGuest
          ? "Back up the workouts on this device and sync them everywhere you log in."
          : "Your workouts sync securely and stay backed up across devices."
      }
      footer={
        <>
          Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Log in</Link>
        </>
      }
      secondaryAction={
        isGuest ? (
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => router.replace("/")}>
            Back to Fits
          </Button>
        ) : undefined
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">At least 8 characters.</p>
        </div>
        <div>
          <Label htmlFor="confirm-password" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Confirm password
          </Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <ConsentFields value={consent} onChange={setConsent} idPrefix="signup" />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="h-11 w-full" disabled={submitting || !hasFullConsent(consent)}>
          {submitting && <CircleNotch className="animate-spin" size={15} />}
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
