import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Service-role key bypasses Row Level Security — never import this file from
// client code or expose the key via a NEXT_PUBLIC_ env var. Only used for
// privileged operations Supabase's client SDK can't do on the user's own
// behalf, like auth.admin.deleteUser (account deletion, Guideline 5.1.1(v)).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — set SUPABASE_SERVICE_ROLE_KEY in .env.local and in Vercel's project env vars (Supabase dashboard > Project Settings > API > service_role key)."
    );
  }
  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
