"use client";

import * as React from "react";
import { isAuthRetryableFetchError, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createClient, readStoredSession } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { startSync, stopSync } from "@/lib/sync/engine";
import { guestModeStore } from "@/lib/auth/guest";

interface AuthContextValue {
  supabase: SupabaseClient<Database>;
  user: User | null;
  session: Session | null;
  /** Using Fits on this device only, with no account (and so no sync). Always false while signed in. */
  isGuest: boolean;
  /** false once the initial session check has resolved (whether or not a user is signed in). */
  loading: boolean;
  continueAsGuest: () => void;
  leaveGuestMode: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = React.useState(() => createClient());
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const guest = React.useSyncExternalStore(
    guestModeStore.subscribe,
    guestModeStore.getSnapshot,
    guestModeStore.getServerSnapshot
  );
  const syncedUserId = React.useRef<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let resolved = false;
    // Open from the locally stored session at once; supabase-js may spend ~25 s refreshing an
    // expired token over a bad connection. Real auth failures still arrive via getSession/SIGNED_OUT.
    void readStoredSession().then((stored) => {
      if (cancelled || resolved || !stored) return;
      setSession(stored);
      setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        resolved = true;
        if (cancelled) return;
        // A network failure is not a sign-out: keep the stored session.
        if (error && isAuthRetryableFetchError(error)) {
          setLoading(false);
          return;
        }
        setSession(data.session);
        setLoading(false);
      })
      // A corrupt or unreadable stored session shouldn't strand the user on the splash screen.
      .catch(() => {
        resolved = true;
        if (cancelled) return;
        setSession(null);
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "INITIAL_SESSION" && !newSession && !resolved) return;
      // Signing in ends guest mode — this device's local data now belongs to (and syncs with) the account.
      if (newSession?.user) guestModeStore.disable();
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  React.useEffect(() => {
    const userId = session?.user.id ?? null;
    if (userId === syncedUserId.current) return;

    if (syncedUserId.current) stopSync(supabase);
    syncedUserId.current = userId;
    if (userId) startSync(supabase, userId).catch(() => {});

    return () => {
      if (syncedUserId.current) {
        stopSync(supabase);
        syncedUserId.current = null;
      }
    };
  }, [session?.user.id, supabase]);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const value = React.useMemo(
    () => ({
      supabase,
      user: session?.user ?? null,
      session,
      isGuest: guest && !session?.user,
      loading,
      continueAsGuest: guestModeStore.enable,
      leaveGuestMode: guestModeStore.disable,
      signOut,
    }),
    [supabase, session, guest, loading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
