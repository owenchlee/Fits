"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleNotch, CloudArrowUp, SignOut, Trash } from "@phosphor-icons/react/dist/ssr";
import { useAuth } from "@/lib/auth/auth-provider";
import { deleteAccount, pendingSyncCount, signOutAndClearDevice } from "@/lib/account";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function friendlyNetworkError(err: unknown, fallback: string) {
  const message = err instanceof Error ? err.message : fallback;
  return /fetch|network|load failed/i.test(message) ? "Check your internet connection and try again." : message;
}

function GuestAccount() {
  return (
    <>
      <div className="mb-3 flex gap-3 rounded-xl bg-secondary/60 p-3">
        <CloudArrowUp size={20} weight="duotone" className="mt-0.5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          You&apos;re using Fits without an account, so your data is saved only on this device. Deleting the app or
          clearing its data erases it. Create a free account to back it up and sync across devices — everything
          you&apos;ve logged comes with you.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/signup">Create account</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    </>
  );
}

function SignedInAccount({ email }: { email: string | undefined }) {
  const router = useRouter();
  const { supabase, user } = useAuth();
  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const [pending, setPending] = React.useState<number | null>(null);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function openLogout() {
    setPending(null);
    setLogoutOpen(true);
    if (user) setPending(await pendingSyncCount(supabase, user.id).catch(() => 0));
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOutAndClearDevice(supabase);
      router.replace("/login");
    } catch (err) {
      toast.error(friendlyNetworkError(err, "Couldn't log out. Please try again."));
      setLoggingOut(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAccount(supabase);
      toast.success("Your account and data have been deleted");
      router.replace("/login");
    } catch (err) {
      toast.error(friendlyNetworkError(err, "Couldn't delete your account. Please try again."));
      setDeleting(false);
    }
  }

  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">
        Signed in as <span className="break-all text-foreground">{email}</span>. Your data syncs automatically across
        every device you log in on.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void openLogout()}>
          <SignOut size={15} /> Log out
        </Button>
        <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
          <Trash size={15} /> Delete account
        </Button>
      </div>

      <AlertDialog open={logoutOpen} onOpenChange={(open) => !loggingOut && setLogoutOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending === null
                ? "Checking for unsynced changes…"
                : pending > 0
                  ? `${pending} recent change${pending === 1 ? " hasn't" : "s haven't"} been backed up yet and will be lost if you log out now. Connect to the internet and try again to keep them.`
                  : "Your data is safely backed up to your account and will be removed from this device. Log back in any time to get it back."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loggingOut}>Cancel</AlertDialogCancel>
            <Button
              variant={pending ? "destructive" : "default"}
              disabled={pending === null || loggingOut}
              onClick={() => void handleLogout()}
            >
              {loggingOut && <CircleNotch className="animate-spin" size={15} />}
              {pending ? "Log out anyway" : "Log out"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={(open) => !deleting && setDeleteOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your account and every workout, program, and measurement in it, on this device
              and on our servers. It can&apos;t be undone — export a backup first if you want to keep your data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting && <CircleNotch className="animate-spin" size={15} />}
              {deleting ? "Deleting…" : "Delete account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function AccountSection() {
  const { user, isGuest } = useAuth();
  return isGuest || !user ? <GuestAccount /> : <SignedInAccount email={user.email} />;
}
