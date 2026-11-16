import type { SupabaseClient } from "@supabase/supabase-js";
import { db } from "@/lib/db/db";
import { resetAllData } from "@/lib/db/repo";
import { ensureSeeded, resetSeedState } from "@/lib/db/bootstrap";
import { enqueueSync } from "@/lib/sync/outbox";
import { flushOutbox } from "@/lib/sync/engine";
import { shouldSyncExercise, shouldSyncProgram } from "@/lib/sync/tables";
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
    const [exercises, programs, workouts, sets, bodyMetrics, snapshots] = await Promise.all([
      db.exercises.filter(shouldSyncExercise).toArray(),
      db.programs.filter(shouldSyncProgram).toArray(),
      db.workouts.toArray(),
      db.sets.toArray(),
      db.bodyMetrics.toArray(),
      db.percentileSnapshots.toArray(),
    ]);
    for (const e of exercises) await enqueueSync("exercises", "delete", e.id);
    for (const p of programs) await enqueueSync("programs", "delete", p.id);
    for (const w of workouts) await enqueueSync("workouts", "delete", w.id);
    for (const s of sets) await enqueueSync("sets", "delete", s.id);
    for (const b of bodyMetrics) await enqueueSync("bodyMetrics", "delete", b.id);
    for (const p of snapshots) await enqueueSync("percentileSnapshots", "delete", p.id);
    await flushOutbox(supabase, userId);
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
  await supabase.auth.signOut();
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
