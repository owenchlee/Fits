import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { db } from "@/lib/db/db";
import type { Database } from "@/lib/supabase/types";
import { onFlushRequested } from "@/lib/sync/outbox";
import {
  REMOTE_TABLE,
  SYNC_TABLES,
  type SyncTable,
  bodyMetricToRow,
  exerciseToRow,
  percentileSnapshotToRow,
  profileRowToSettings,
  programToRow,
  rowToBodyMetric,
  rowToExercise,
  rowToPercentileSnapshot,
  rowToProgram,
  rowToSet,
  rowToWorkout,
  setToRow,
  settingsToProfileRow,
  shouldSyncExercise,
  shouldSyncProgram,
  workoutToRow,
} from "@/lib/sync/tables";

type Client = SupabaseClient<Database>;

/**
 * Supabase's generated types want a literal table name, not one looked up dynamically by variable
 * (which is what the outbox/pull loops below do to stay generic across tables) — that collapses
 * inference to `never`. Row shapes are still fully typed at the boundary via tables.ts's per-table
 * to/fromRow functions, so this narrow `any` is contained to dynamic `.from()` dispatch only.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dynamicFrom(supabase: Client, table: string): any {
  return (supabase as unknown as { from(table: string): unknown }).from(table);
}

const TO_ROW: Record<SyncTable, (record: unknown, userId: string) => Record<string, unknown>> = {
  exercises: exerciseToRow as never,
  programs: programToRow as never,
  workouts: workoutToRow as never,
  sets: setToRow as never,
  bodyMetrics: bodyMetricToRow as never,
  percentileSnapshots: percentileSnapshotToRow as never,
};

const FROM_ROW: Record<SyncTable, (row: never) => { id: string; updatedAt: number }> = {
  exercises: rowToExercise as never,
  programs: rowToProgram as never,
  workouts: rowToWorkout as never,
  sets: rowToSet as never,
  bodyMetrics: rowToBodyMetric as never,
  percentileSnapshots: rowToPercentileSnapshot as never,
};

/** Pushes every queued local write to Supabase. Leaves failed entries in the outbox for the next try. */
export async function flushOutbox(supabase: Client, userId: string) {
  const pending = await db.syncOutbox.orderBy("createdAt").toArray();
  for (const entry of pending) {
    try {
      if (entry.table === "settings") {
        const settings = await db.settings.get("singleton");
        if (settings) await supabase.from("profiles").upsert(settingsToProfileRow(settings, userId));
      } else if (entry.op === "delete") {
        await dynamicFrom(supabase, REMOTE_TABLE[entry.table])
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", entry.recordId)
          .eq("user_id", userId);
      } else {
        const record = await db.table(entry.table).get(entry.recordId);
        if (!record) {
          // Deleted locally before this upsert flushed — nothing to push.
        } else if (entry.table === "exercises" && !shouldSyncExercise(record)) {
          // built-in, never synced
        } else if (entry.table === "programs" && !shouldSyncProgram(record)) {
          // built-in, never synced
        } else {
          const row = TO_ROW[entry.table](record, userId);
          await dynamicFrom(supabase, REMOTE_TABLE[entry.table]).upsert(row);
        }
      }
      if (entry.id !== undefined) await db.syncOutbox.delete(entry.id);
    } catch {
      // Leave it queued; the next flush (interval/online/realtime-triggered) retries it.
      break;
    }
  }
}

/** Last-write-wins merge: only apply a row if it's newer than (or absent from) the local copy. */
async function mergeRow(table: SyncTable, row: never) {
  const remoteUpdatedAt = new Date((row as { updated_at: string }).updated_at).getTime();
  const deletedAt = (row as { deleted_at: string | null }).deleted_at;
  const id = (row as { id: string }).id;
  const local = await db.table(table).get(id);

  if (deletedAt) {
    if (local) await db.table(table).delete(id);
    return;
  }
  if (local && (local as { updatedAt: number }).updatedAt > remoteUpdatedAt) return;
  await db.table(table).put(FROM_ROW[table](row));
}

export async function pullAll(supabase: Client, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (profile) {
    const local = await db.settings.get("singleton");
    const remoteUpdatedAt = new Date(profile.updated_at).getTime();
    if (!local || remoteUpdatedAt > local.updatedAt) {
      await db.settings.update("singleton", { ...profileRowToSettings(profile), updatedAt: remoteUpdatedAt });
    }
  }

  for (const table of SYNC_TABLES) {
    const { data, error } = await dynamicFrom(supabase, REMOTE_TABLE[table]).select("*").eq("user_id", userId);
    if (error || !data) continue;
    for (const row of data) await mergeRow(table, row as never);
  }
}

let realtimeChannel: RealtimeChannel | null = null;
let flushInterval: ReturnType<typeof setInterval> | null = null;
let onlineHandler: (() => void) | null = null;

function subscribeRealtime(supabase: Client, userId: string): RealtimeChannel {
  let channel = supabase.channel(`fits-sync-${userId}`);
  for (const table of SYNC_TABLES) {
    channel = channel.on(
      "postgres_changes" as never,
      { event: "*", schema: "public", table: REMOTE_TABLE[table], filter: `user_id=eq.${userId}` } as never,
      (payload: { new: never }) => void mergeRow(table, payload.new)
    );
  }
  channel = channel.on(
    "postgres_changes" as never,
    { event: "*", schema: "public", table: "profiles", filter: `id=eq.${userId}` } as never,
    (payload: { new: { updated_at: string } & Record<string, unknown> }) =>
      void (async () => {
        const local = await db.settings.get("singleton");
        const remoteUpdatedAt = new Date(payload.new.updated_at).getTime();
        if (!local || remoteUpdatedAt > local.updatedAt) {
          await db.settings.update("singleton", {
            ...profileRowToSettings(payload.new as never),
            updatedAt: remoteUpdatedAt,
          });
        }
      })()
  );
  channel.subscribe();
  return channel;
}

/** Call once after sign-in: pulls remote data, flushes any queued local writes, and stays live. */
export async function startSync(supabase: Client, userId: string) {
  onFlushRequested(() => void flushOutbox(supabase, userId));

  await pullAll(supabase, userId);
  await flushOutbox(supabase, userId);

  realtimeChannel = subscribeRealtime(supabase, userId);
  flushInterval = setInterval(() => void flushOutbox(supabase, userId), 15_000);
  onlineHandler = () => void flushOutbox(supabase, userId);
  window.addEventListener("online", onlineHandler);
}

/** Call on sign-out: stops all background sync activity. Local Dexie data is left as-is. */
export function stopSync(supabase: Client) {
  onFlushRequested(null);
  if (realtimeChannel) {
    void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
  if (onlineHandler) {
    window.removeEventListener("online", onlineHandler);
    onlineHandler = null;
  }
}
