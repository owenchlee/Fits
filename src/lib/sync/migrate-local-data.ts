import type { SupabaseClient } from "@supabase/supabase-js";
import { db } from "@/lib/db/db";
import type { AppSettings } from "@/lib/db/types";
import type { Database } from "@/lib/supabase/types";
import { enqueueSync } from "@/lib/sync/outbox";
import { dynamicFrom } from "@/lib/sync/engine";
import {
  REMOTE_TABLE,
  type SyncTable,
  bodyMetricToRow,
  exerciseToRow,
  percentileSnapshotToRow,
  programToRow,
  setToRow,
  settingsToProfileRow,
  workoutToRow,
} from "@/lib/sync/tables";

const CHUNK = 500;
const PAGE = 1000;

/** True when the guest changed anything from the factory defaults seeded in bootstrap.ts. */
function settingsChanged(s: AppSettings | undefined): boolean {
  if (!s) return false;
  return (
    s.unitSystem !== "lb" ||
    s.sex !== "male" ||
    s.bodyweightKg !== 80 ||
    s.defaultRestSeconds !== 120 ||
    s.barWeightKg !== 20 ||
    JSON.stringify(s.availablePlatesKg) !== JSON.stringify([25, 20, 15, 10, 5, 2.5, 1.25]) ||
    s.streak !== 0 ||
    s.lastWorkoutDate !== undefined ||
    s.activeProgramId !== undefined ||
    s.activeProgramDayIndex !== undefined
  );
}

/** Whether this device has pre-existing local data worth offering to upload on first sign-in. */
export async function hasLocalDataToMigrate(): Promise<boolean> {
  const [customExercises, customPrograms, workouts, bodyMetrics, snapshots, settings] = await Promise.all([
    db.exercises.filter((e) => e.isCustom).count(),
    db.programs.filter((p) => p.isCustom).count(),
    db.workouts.count(),
    db.bodyMetrics.count(),
    db.percentileSnapshots.count(),
    db.settings.get("singleton"),
  ]);
  return (
    customExercises > 0 || customPrograms > 0 || workouts > 0 || bodyMetrics > 0 || snapshots > 0 || settingsChanged(settings)
  );
}

/** Remote id -> updated_at (ms) for the user's rows in one table, paged past PostgREST's row cap. */
async function remoteVersions(supabase: SupabaseClient<Database>, table: SyncTable, userId: string) {
  const seen = new Map<string, number>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await dynamicFrom(supabase, REMOTE_TABLE[table])
      .select("id,updated_at")
      .eq("user_id", userId)
      .range(from, from + PAGE - 1);
    if (error || !data) break; // unknown remote state: upload everything rather than skip anything
    for (const r of data as { id: string; updated_at: string }[]) seen.set(r.id, Date.parse(r.updated_at));
    if (data.length < PAGE) break;
  }
  return seen;
}

/** Uploads this device's local Dexie data to a just-created (or just-signed-into) account. */
export async function migrateLocalDataToAccount(supabase: SupabaseClient<Database>, userId: string) {
  const [exercises, programs, workouts, sets, bodyMetrics, snapshots, settings] = await Promise.all([
    db.exercises.filter((e) => e.isCustom).toArray(),
    db.programs.filter((p) => p.isCustom).toArray(),
    db.workouts.toArray(),
    db.sets.toArray(),
    db.bodyMetrics.toArray(),
    db.percentileSnapshots.toArray(),
    db.settings.get("singleton"),
  ]);

  // Parents first so foreign keys resolve.
  const plan: { table: SyncTable; records: { id: string; updatedAt: number }[]; toRow: (r: unknown, userId: string) => Record<string, unknown> }[] = [
    { table: "exercises", records: exercises, toRow: exerciseToRow as never },
    { table: "programs", records: programs, toRow: programToRow as never },
    { table: "workouts", records: workouts, toRow: workoutToRow as never },
    { table: "sets", records: sets, toRow: setToRow as never },
    { table: "bodyMetrics", records: bodyMetrics, toRow: bodyMetricToRow as never },
    { table: "percentileSnapshots", records: snapshots, toRow: percentileSnapshotToRow as never },
  ];

  let failed = 0;
  const requeue = async (table: "settings" | SyncTable, ids: string[]) => {
    failed += ids.length;
    for (const id of ids) await enqueueSync(table, "upsert", id);
  };

  for (const { table, records, toRow } of plan) {
    const remote = await remoteVersions(supabase, table, userId);
    const todo = records.filter((r) => !((remote.get(r.id) ?? -1) >= r.updatedAt));
    for (let i = 0; i < todo.length; i += CHUNK) {
      const chunk = todo.slice(i, i + CHUNK);
      const { error } = await dynamicFrom(supabase, REMOTE_TABLE[table]).upsert(chunk.map((r) => toRow(r, userId)));
      if (error) await requeue(table, chunk.map((r) => r.id));
    }
  }

  // Untouched guest defaults must never overwrite an existing account's profile.
  if (settings && settingsChanged(settings)) {
    const { data } = await supabase.from("profiles").select("updated_at").eq("id", userId).single();
    if (!data || Date.parse(data.updated_at) < settings.updatedAt) {
      const { error } = await supabase.from("profiles").upsert(settingsToProfileRow(settings, userId));
      if (error) await requeue("settings", ["singleton"]);
    }
  }

  if (failed > 0) throw new Error(`${failed} local records could not be uploaded; they stay queued and will retry`);
}
