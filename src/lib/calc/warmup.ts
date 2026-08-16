import type { SetEntry, UnitSystem } from "@/lib/db/types";
import { kgToLb, lbToKg } from "@/lib/calc/units";

/**
 * Estimate a warm-up set (weight + reps) from the lifter's most recent working sets
 * for this exercise, so a fresh session starts with a sensible load instead of "0".
 * Rounds to plates a lifter can actually find on the rack: 5 lb jumps (2.5 lb in lb mode
 * as a floor, since 5 lb plates aren't always available) or 2.5 kg jumps in kg mode.
 * Returns null when there's no prior performance to base it on.
 */
export function calculateWarmupSet(
  previousSets: SetEntry[],
  unit: UnitSystem = "kg"
): { weightKg: number; reps: number } | null {
  const working = previousSets.filter((s) => !s.isWarmup && s.weightKg > 0 && s.reps > 0);
  if (working.length === 0) return null;

  const topSet = working.reduce((max, s) => (s.weightKg > max.weightKg ? s : max), working[0]);
  const rawDisplay = unit === "kg" ? topSet.weightKg * 0.5 : kgToLb(topSet.weightKg) * 0.5;

  const increment = unit === "kg" ? 2.5 : 5;
  const floor = 2.5;
  const roundedDisplay = Math.max(Math.round(rawDisplay / increment) * increment, floor);

  const weightKg = unit === "kg" ? roundedDisplay : lbToKg(roundedDisplay);
  const reps = Math.max(topSet.reps, 10);

  return { weightKg, reps };
}
