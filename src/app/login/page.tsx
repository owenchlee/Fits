"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { useAuth } from "@/lib/auth/auth-provider";
import { authErrorMessage } from "@/lib/auth/friendly-error";
import { hasLocalDataToMigrate, migrateLocalDataToAccount } from "@/lib/sync/migrate-local-data";
import { AuthCard } from "@/components/auth/auth-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { supabase, isGuest, continueAsGuest } = useAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const wasGuest = isGuest;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setSubmitting(false);
      setError(authErrorMessage(error));
      return;
    }
    // Workouts logged as a guest on this device join the account rather than being stranded.
    if (wasGuest && data.user && (await hasLocalDataToMigrate())) {
      await migrateLocalDataToAccount(supabase, data.user.id).catch(() => {});
    }
    setSubmitting(false);
    toast.success("Welcome back");
    router.replace("/");
  }

  function handleContinueAsGuest() {
    continueAsGuest();
    router.replace("/");
  }

  return (
    <AuthCard
      title="Log in"
      description={
        isGuest
          ? "Log in to back up and sync the workouts on this device."
          : "Sync your training log across every device."
      }
      footer={
        <>
          Don&apos;t have an account? <Link href="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
        </>
      }
      secondaryAction={
        isGuest ? (
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => router.replace("/")}>
            Back to Fits
          </Button>
        ) : (
          <Button variant="outline" size="lg" className="h-11 w-full" onClick={handleContinueAsGuest}>
            Continue without an account
          </Button>
        )
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
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
              Password
            </Label>
            <Link href="/reset-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="h-11 w-full" disabled={submitting}>
          {submitting && <CircleNotch className="animate-spin" size={15} />}
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}
