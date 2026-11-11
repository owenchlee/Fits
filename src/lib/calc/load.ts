import type { Exercise } from "@/lib/db/types";

/** True for a set the lifter actually logged, not the blank 0 x 0 row the logger pre-creates. */
export function isLoggedSet(
  s: { weightKg: number; reps: number },
  exercise: Pick<Exercise, "equipment"> | null | undefined
): boolean {
  const unloaded = exercise?.equipment === "bodyweight" || exercise?.equipment === "bands";
  return s.reps > 0 && (unloaded || s.weightKg > 0);
}

/**
 * Converts an entered per-set weight into total load for e1RM/percentile/volume math.
 * Dumbbell entries mean "one dumbbell" — a bilateral two-dumbbell lift doubles to
 * reconstruct total load. Unilateral dumbbell (or any other single-side) entries are
 * already the full working load, so they pass through unchanged.
 */
export function toTotalLoadKg(
  weightKg: number,
  exercise: Pick<Exercise, "equipment" | "isUnilateral"> | null | undefined
): number {
  if (exercise?.equipment === "dumbbell" && !exercise.isUnilateral) return weightKg * 2;
  return weightKg;
}
