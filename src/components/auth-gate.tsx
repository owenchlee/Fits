"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { useAuth } from "@/lib/auth/auth-provider";
import { AppShell } from "@/components/layout/app-shell";

const PUBLIC_PATHS = ["/login", "/signup", "/reset-password"];
/** Reached via the password-recovery email link, which signs the user in — must render even
 * though a session exists, unlike every other "public" auth page (login/signup). */
const ALWAYS_ACCESSIBLE_PATHS = ["/reset-password/confirm"];

function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <CircleNotch className="animate-spin text-muted-foreground" size={24} />
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAlwaysAccessible = ALWAYS_ACCESSIBLE_PATHS.some((p) => pathname.startsWith(p));
  const isPublicAuthPage = !isAlwaysAccessible && PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  React.useEffect(() => {
    if (loading || isAlwaysAccessible) return;
    if (!user && !isPublicAuthPage) router.replace("/login");
    else if (user && isPublicAuthPage) router.replace("/");
  }, [user, loading, isPublicAuthPage, isAlwaysAccessible, pathname, router]);

  if (isAlwaysAccessible) {
    return <div className="flex min-h-dvh items-center justify-center px-4 py-10">{children}</div>;
  }

  if (loading) return <FullScreenLoader />;

  if (isPublicAuthPage) {
    if (user) return <FullScreenLoader />;
    return <div className="flex min-h-dvh items-center justify-center px-4 py-10">{children}</div>;
  }

  if (!user) return <FullScreenLoader />;

  return <AppShell>{children}</AppShell>;
}
