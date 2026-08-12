import type { SupabaseClient } from "@supabase/supabase-js";
import { db } from "@/lib/db/db";
import type { Database } from "@/lib/supabase/types";
import { enqueueSync } from "@/lib/sync/outbox";
import { flushOutbox } from "@/lib/sync/engine";

/** Whether this device has pre-existing local data worth offering to upload on first sign-in. */
export async function hasLocalDataToMigrate(): Promise<boolean> {
  const [customExercises, customPrograms, workouts, bodyMetrics] = await Promise.all([
    db.exercises.filter((e) => e.isCustom).count(),
    db.programs.filter((p) => p.isCustom).count(),
    db.workouts.count(),
    db.bodyMetrics.count(),
  ]);
  return customExercises > 0 || customPrograms > 0 || workouts > 0 || bodyMetrics > 0;
}

/** Uploads this device's local Dexie data to a just-created (or just-signed-into) account. */
export async function migrateLocalDataToAccount(supabase: SupabaseClient<Database>, userId: string) {
  const [exercises, programs, workouts, sets, bodyMetrics] = await Promise.all([
    db.exercises.filter((e) => e.isCustom).toArray(),
    db.programs.filter((p) => p.isCustom).toArray(),
    db.workouts.toArray(),
    db.sets.toArray(),
    db.bodyMetrics.toArray(),
  ]);

  for (const e of exercises) await enqueueSync("exercises", "upsert", e.id);
  for (const p of programs) await enqueueSync("programs", "upsert", p.id);
  for (const w of workouts) await enqueueSync("workouts", "upsert", w.id);
  for (const s of sets) await enqueueSync("sets", "upsert", s.id);
  for (const b of bodyMetrics) await enqueueSync("bodyMetrics", "upsert", b.id);
  await enqueueSync("settings", "upsert", "singleton");

  await flushOutbox(supabase, userId);
}
