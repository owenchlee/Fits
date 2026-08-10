/** Epley formula — the industry-standard estimate used by Strong, Hevy, etc. */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Reverse-Epley: weight to use for a target rep count at a given 1RM. */
export function weightForReps(oneRepMax: number, reps: number): number {
  if (reps <= 1) return oneRepMax;
  return oneRepMax / (1 + reps / 30);
}
