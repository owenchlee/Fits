import { db } from "@/lib/db/db";
import { estimateOneRepMax } from "@/lib/calc/one-rep-max";
import { toTotalLoadKg } from "@/lib/calc/load";
import { calculateExercisePercentile, totalToPercentile, type StandardLift } from "@/lib/calc/strength-standards";
import { enqueueSync } from "@/lib/sync/outbox";

const BIG_THREE: StandardLift[] = ["squat", "bench", "deadlift"];

/**
 * Recomputes today's strength-percentile snapshot from current best lifts and upserts it (one row
 * per day). Called after every completed workout so /statistics can chart percentile over time.
 */
export async function recordPercentileSnapshot() {
  const settings = await db.settings.get("singleton");
  if (!settings || settings.bodyweightKg <= 0) return;
  const { sex, bodyweightKg } = settings;

  const exercises = await db.exercises.filter((e) => e.standardLift !== null || !!e.standardLiftRatio).toArray();
  const perLift: Record<string, number> = {};
  const anchorBestKg: Partial<Record<StandardLift, number>> = {};

  for (const ex of exercises) {
    const sets = await db.sets.where("exerciseId").equals(ex.id).filter((s) => !s.isWarmup).toArray();
    if (sets.length === 0) continue;
    const bestKg = sets.reduce((max, s) => Math.max(max, estimateOneRepMax(toTotalLoadKg(s.weightKg, ex), s.reps)), 0);
    if (bestKg <= 0) continue;

    if (ex.standardLift) anchorBestKg[ex.standardLift] = Math.max(anchorBestKg[ex.standardLift] ?? 0, bestKg);

    const result = calculateExercisePercentile(ex, bestKg, bodyweightKg, sex);
    if (result) perLift[ex.id] = Math.round(result.percentile * 10) / 10;
  }

  let overallPercentile: number | null = null;
  if (BIG_THREE.every((l) => (anchorBestKg[l] ?? 0) > 0)) {
    const totalKg = BIG_THREE.reduce((sum, l) => sum + (anchorBestKg[l] ?? 0), 0);
    overallPercentile = Math.round(totalToPercentile(totalKg, bodyweightKg, sex) * 10) / 10;
  }

  if (overallPercentile === null && Object.keys(perLift).length === 0) return;

  const date = new Date().toISOString().slice(0, 10);
  await db.percentileSnapshots.put({
    id: date,
    date,
    overallPercentile,
    perLift,
    updatedAt: Date.now(),
  });
  await enqueueSync("percentileSnapshots", "upsert", date);
}
