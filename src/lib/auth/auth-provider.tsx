"use client";

import * as React from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { startSync, stopSync } from "@/lib/sync/engine";

interface AuthContextValue {
  supabase: SupabaseClient<Database>;
  user: User | null;
  session: Session | null;
  /** false once the initial session check has resolved (whether or not a user is signed in). */
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = React.useState(() => createClient());
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const syncedUserId = React.useRef<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
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
    if (userId) void startSync(supabase, userId);

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
    () => ({ supabase, user: session?.user ?? null, session, loading, signOut }),
    [supabase, session, loading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
