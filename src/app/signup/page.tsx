"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleNotch, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { useAuth } from "@/lib/auth/auth-provider";
import { hasLocalDataToMigrate, migrateLocalDataToAccount } from "@/lib/sync/migrate-local-data";
import { AuthCard } from "@/components/auth/auth-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SignupPage() {
  const { supabase } = useAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [checkEmail, setCheckEmail] = React.useState(false);
  const [migratePrompt, setMigratePrompt] = React.useState<{ userId: string } | null>(null);
  const [migrating, setMigrating] = React.useState(false);

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

    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }

    if (!data.session || !data.user) {
      setCheckEmail(true);
      return;
    }

    if (await hasLocalDataToMigrate()) {
      setMigratePrompt({ userId: data.user.id });
      return;
    }

    toast.success("Account created");
    router.replace("/");
  }

  async function handleMigrate(shouldMigrate: boolean) {
    if (!migratePrompt) return;
    if (shouldMigrate) {
      setMigrating(true);
      await migrateLocalDataToAccount(supabase, migratePrompt.userId);
      setMigrating(false);
      toast.success("Your data is synced to your account");
    } else {
      toast.success("Account created");
    }
    setMigratePrompt(null);
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
    <>
      <AuthCard
        title="Create your account"
        description="Your workouts sync securely and stay backed up across devices."
        footer={
          <>
            Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Log in</Link>
          </>
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <CircleNotch className="animate-spin" size={15} />}
            Create account
          </Button>
        </form>
      </AuthCard>

      <AlertDialog open={migratePrompt !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sync your existing data?</AlertDialogTitle>
            <AlertDialogDescription>
              This device already has workouts logged locally. Upload them to your new account so they sync across
              your devices — otherwise they&apos;ll stay only on this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={migrating} onClick={() => void handleMigrate(false)}>
              Skip
            </AlertDialogCancel>
            <AlertDialogAction disabled={migrating} onClick={() => void handleMigrate(true)}>
              {migrating && <CircleNotch className="animate-spin" size={15} />}
              Upload my data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
