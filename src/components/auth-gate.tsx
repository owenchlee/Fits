"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { Barbell } from "@phosphor-icons/react/dist/ssr";
import { useAuth } from "@/lib/auth/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import { ConsentGate, useNeedsConsent } from "@/components/legal/consent-gate";
import { cn } from "@/lib/utils";

/** How long the splash replays for on native app-resume, in ms. */
const RESUME_SPLASH_DURATION = 900;

const PUBLIC_PATHS = ["/login", "/signup", "/reset-password"];
/** Reached via the password-recovery email link, which signs the user in — must render even
 * though a session exists, unlike every other "public" auth page (login/signup). */
const ALWAYS_ACCESSIBLE_PATHS = ["/reset-password/confirm"];
/** Legal and support pages must be readable by anyone — signed out, mid-consent, and App Review —
 * and bring their own layout (see LegalPage). */
const LEGAL_PATHS = ["/privacy", "/terms", "/health-data", "/support", "/licenses"];

function FullScreenLoader({ overlay = false }: { overlay?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col items-center justify-center gap-4 bg-background",
        overlay && "fixed inset-0 z-[60]"
      )}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.08, 1], opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex size-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-xl shadow-primary/30"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
        >
          <Barbell size={40} weight="fill" />
        </motion.div>
      </motion.div>
      <motion.span
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="font-display text-2xl font-bold tracking-tight"
      >
        Fits
      </motion.span>
    </div>
  );
}

function CenteredPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[calc(2.5rem+env(safe-area-inset-top))]">
      {children}
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isGuest, loading } = useAuth();
  const needsConsent = useNeedsConsent();
  const pathname = usePathname();
  const router = useRouter();
  const isLegalPage = LEGAL_PATHS.some((p) => pathname.startsWith(p));
  const isAlwaysAccessible = ALWAYS_ACCESSIBLE_PATHS.some((p) => pathname.startsWith(p));
  const isPublicAuthPage = !isAlwaysAccessible && PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const hasAccess = !!user || isGuest;

  const [resuming, setResuming] = React.useState(false);
  const hasLoadedOnceRef = React.useRef(false);
  React.useEffect(() => {
    if (!loading) hasLoadedOnceRef.current = true;
  }, [loading]);

  // The native webview stays alive across backgrounding, so `loading` above never flips back
  // to true on resume — replay the splash manually when the app returns to the foreground.
  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let hideTimeout: ReturnType<typeof setTimeout> | undefined;
    let removeListener: (() => void) | undefined;

    void (async () => {
      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("appStateChange", ({ isActive }) => {
        if (!isActive || !hasLoadedOnceRef.current) return;
        setResuming(true);
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => setResuming(false), RESUME_SPLASH_DURATION);
      });
      removeListener = () => void handle.remove();
    })();

    return () => {
      clearTimeout(hideTimeout);
      removeListener?.();
    };
  }, []);

  React.useEffect(() => {
    if (loading || isAlwaysAccessible || isLegalPage) return;
    if (!hasAccess && !isPublicAuthPage) router.replace("/login");
    // Guests may visit log in / sign up — that's how they upgrade to an account.
    else if (user && isPublicAuthPage) router.replace("/");
  }, [user, hasAccess, loading, isPublicAuthPage, isAlwaysAccessible, isLegalPage, pathname, router]);

  if (isLegalPage) return <>{children}</>;

  if (isAlwaysAccessible) {
    return <CenteredPage>{children}</CenteredPage>;
  }

  if (loading) return <FullScreenLoader />;

  if (isPublicAuthPage) {
    if (user) return <FullScreenLoader />;
    return <CenteredPage>{children}</CenteredPage>;
  }

  if (!hasAccess) return <FullScreenLoader />;

  if (needsConsent) return <ConsentGate />;

  // The resume splash covers the app rather than replacing it: unmounting here would remount
  // every page on each foreground, dropping unsaved input and re-running every DB query at once.
  return (
    <>
      <AppShell>{children}</AppShell>
      {resuming && <FullScreenLoader overlay />}
    </>
  );
}
