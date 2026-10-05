import type { Exercise, SetEntry } from "@/lib/db/types";

/** Equipment where 0 logged weight is a real, complete set (no added load), not a blank field. */
const WEIGHT_OPTIONAL: ReadonlySet<Exercise["equipment"]> = new Set(["bodyweight", "bands"]);

export function isWeightOptional(exercise: Pick<Exercise, "equipment"> | null | undefined): boolean {
  return !!exercise && WEIGHT_OPTIONAL.has(exercise.equipment);
}

/**
 * A set counts as done once it has reps and — unless the exercise is bodyweight/bands, where
 * "no added weight" is legitimate — a weight. Sets are pre-created blank (0 × 0) when an exercise
 * is added, so this is what separates "logged" from "still to do".
 */
export function isSetComplete(
  set: Pick<SetEntry, "weightKg" | "reps">,
  exercise: Pick<Exercise, "equipment"> | null | undefined
): boolean {
  return set.reps > 0 && (set.weightKg > 0 || isWeightOptional(exercise));
}
