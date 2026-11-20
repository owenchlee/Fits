import { db } from "@/lib/db/db";
import { estimateOneRepMax } from "@/lib/calc/one-rep-max";
import { toTotalLoadKg } from "@/lib/calc/load";
import { calculateExercisePercentile, totalToPercentile, type StandardLift } from "@/lib/calc/strength-standards";
import { dateKey, parseDateKey } from "@/lib/date";
import { enqueueSync } from "@/lib/sync/outbox";

const BIG_THREE: StandardLift[] = ["squat", "bench", "deadlift"];

/**
 * Recomputes the strength-percentile snapshot for each given local day (YYYY-MM-DD) from the best
 * lifts over workouts FINISHED by the end of that day, then upserts it (one row per day). A day with
 * no lift left has its snapshot deleted. Called after a finished workout and after history edits.
 */
export async function recomputePercentileSnapshots(dates: string[]) {
  if (dates.length === 0) return;
  const [settings, exercises, workouts, allSets] = await Promise.all([
    db.settings.get("singleton"),
    db.exercises.filter((e) => e.standardLift !== null || !!e.standardLiftRatio).toArray(),
    db.workouts.filter((w) => !!w.completedAt).toArray(),
    db.sets.toArray(),
  ]);
  if (!settings || settings.bodyweightKg <= 0) return;
  const { sex, bodyweightKg } = settings;

  // One pass over all sets: best e1RM per exercise per finished workout.
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const finishedAt = new Map(workouts.map((w) => [w.id, w.completedAt as number]));
  const perWorkout = new Map<string, Map<string, number>>();
  for (const s of allSets) {
    const ex = byId.get(s.exerciseId);
    if (!ex || s.isWarmup || !finishedAt.has(s.workoutId)) continue;
    const m = perWorkout.get(s.workoutId) ?? new Map<string, number>();
    m.set(ex.id, Math.max(m.get(ex.id) ?? 0, estimateOneRepMax(toTotalLoadKg(s.weightKg, ex), s.reps)));
    perWorkout.set(s.workoutId, m);
  }

  for (const date of dates) {
    const d = parseDateKey(date);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
    const bests = new Map<string, number>();
    for (const [wid, m] of perWorkout) {
      if ((finishedAt.get(wid) as number) >= end) continue;
      for (const [id, v] of m) bests.set(id, Math.max(bests.get(id) ?? 0, v));
    }

    const perLift: Record<string, number> = {};
    const anchorBestKg: Partial<Record<StandardLift, number>> = {};
    for (const ex of exercises) {
      const bestKg = bests.get(ex.id);
      if (bestKg === undefined || bestKg <= 0) continue;
      if (ex.standardLift) anchorBestKg[ex.standardLift] = Math.max(anchorBestKg[ex.standardLift] ?? 0, bestKg);
      const result = calculateExercisePercentile(ex, bestKg, bodyweightKg, sex);
      if (result) perLift[ex.id] = Math.round(result.percentile * 10) / 10;
    }

    let overallPercentile: number | null = null;
    if (BIG_THREE.every((l) => (anchorBestKg[l] ?? 0) > 0)) {
      const totalKg = BIG_THREE.reduce((sum, l) => sum + (anchorBestKg[l] ?? 0), 0);
      overallPercentile = Math.round(totalToPercentile(totalKg, bodyweightKg, sex) * 10) / 10;
    }

    if (overallPercentile === null && Object.keys(perLift).length === 0) {
      if (await db.percentileSnapshots.get(date)) {
        await db.percentileSnapshots.delete(date);
        await enqueueSync("percentileSnapshots", "delete", date);
      }
      continue;
    }
    await db.percentileSnapshots.put({ id: date, date, overallPercentile, perLift, updatedAt: Date.now() });
    await enqueueSync("percentileSnapshots", "upsert", date);
  }
}

/** Records today's snapshot (called after every completed workout). */
export function recordPercentileSnapshot() {
  return recomputePercentileSnapshots([dateKey(new Date())]);
}

/** After editing/deleting a finished workout: refix every stored snapshot from that workout's day on. */
export async function refreshSnapshotsFrom(completedAt: number) {
  const from = dateKey(new Date(completedAt));
  const keys = await db.percentileSnapshots.where("date").aboveOrEqual(from).primaryKeys();
  await recomputePercentileSnapshots(keys.map(String));
}
