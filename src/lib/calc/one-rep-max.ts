/**
 * Epley formula — the industry-standard estimate used by Strong, Hevy, etc. Reps beyond 12 are
 * clamped: Epley's extrapolation error grows with rep count, and for ratio-estimated exercises
 * (see calculateExercisePercentile) that error then gets divided by a sub-1 ratio, amplifying it
 * further — an uncapped high-rep set can produce a wildly inflated "equivalent 1RM".
 */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + Math.min(reps, 12) / 30);
}

/** Reverse-Epley: weight to use for a target rep count at a given 1RM. */
export function weightForReps(oneRepMax: number, reps: number): number {
  if (reps <= 1) return oneRepMax;
  return oneRepMax / (1 + reps / 30);
}
