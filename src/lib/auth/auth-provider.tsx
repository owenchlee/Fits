"use client";

import * as React from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
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
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      // A corrupt or unreadable stored session shouldn't strand the user on the splash screen.
      .catch(() => setSession(null))
      .finally(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Signing in ends guest mode — this device's local data now belongs to (and syncs with) the account.
      if (newSession?.user) guestModeStore.disable();
      setSession(newSession);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
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
