import type { SupabaseClient } from "@supabase/supabase-js";
import { db } from "@/lib/db/db";
import { resetAllData } from "@/lib/db/repo";
import { ensureSeeded, resetSeedState } from "@/lib/db/bootstrap";
import { dynamicFrom, flushOutbox } from "@/lib/sync/engine";
import { REMOTE_TABLE, SYNC_TABLES } from "@/lib/sync/tables";
import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

/** Wipes the local database and re-seeds the built-in exercises/programs and default settings. */
export async function clearDeviceData() {
  await resetAllData();
  resetSeedState();
  await ensureSeeded();
}

/**
 * "Reset all data": erases every workout, program, and measurement on this device and, when signed
 * in, in the account too — otherwise the next sync would just pull everything back down.
 */
export async function resetEverything(supabase: Client, userId: string | null) {
  if (userId) {
    // One bulk soft-delete per table (covers rows this device never pulled); any failure rejects
    // before the device is touched, so offline never wipes local data the server still has.
    const failed = () => new Error("Couldn't reset your account. Check your connection and try again.");
    const deletedAt = new Date().toISOString();
    for (const t of SYNC_TABLES) {
      const { error } = await dynamicFrom(supabase, REMOTE_TABLE[t])
        .update({ deleted_at: deletedAt })
        .eq("user_id", userId)
        .is("deleted_at", null);
      if (error) throw failed();
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        streak: 0,
        last_workout_date: null,
        active_program_id: null,
        active_program_day_index: null,
        updated_at: deletedAt,
      })
      .eq("id", userId);
    if (error) throw failed();
  }
  await clearDeviceData();
}

/** Number of local changes that haven't reached the server yet. */
export async function pendingSyncCount(supabase: Client, userId: string) {
  await flushOutbox(supabase, userId).catch(() => {});
  return db.syncOutbox.count();
}

/**
 * Signs out and clears this device, so the next person to log in here (with a different account,
 * or as a guest) never sees — or uploads into their own account — the previous user's data. The
 * account's copy is untouched and comes back on the next log-in. Callers should check
 * pendingSyncCount first and warn, since unsynced changes are lost.
 */
export async function signOutAndClearDevice(supabase: Client) {
  const { error } = await supabase.auth.signOut();
  // A failed global sign-out (offline) keeps the session; drop it locally so we never wipe a still-signed-in device.
  if (error) await supabase.auth.signOut({ scope: "local" });
  await clearDeviceData();
}

/**
 * Deletes the account server-side (see /api/account/delete), then clears this device. The access
 * token goes in a header because the native app's session isn't in a cookie.
 */
export async function deleteAccount(supabase: Client) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch("/api/account/delete", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Couldn't delete your account. Please try again.");
  }
  // The server already deleted the user, so this sign-out may fail to revoke the (now invalid)
  // refresh token remotely — it still clears the local session, which is all that's left to do.
  await supabase.auth.signOut({ scope: "local" }).catch(() => {});
  await clearDeviceData();
}
