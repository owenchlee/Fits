import type { Sex } from "@/lib/db/types";

export type StandardLift = "squat" | "bench" | "deadlift" | "overhead-press";

export type StrengthTier = "Beginner" | "Novice" | "Intermediate" | "Advanced" | "Elite";

/**
 * Bodyweight-multiplier checkpoints at fixed percentiles, sourced from widely-cited
 * community strength-standards aggregates (StrengthLevel / Lon Kilgore style tables).
 * These are population estimates, not a scientific census — the UI must present them
 * as such. Checkpoints: 5th, 20th, 50th, 80th, 95th, 99th percentile.
 */
const PERCENTILE_CHECKPOINTS = [5, 20, 50, 80, 95, 99];

const MALE_STANDARDS: Record<StandardLift, number[]> = {
  squat: [0.5, 0.9, 1.5, 2.0, 2.5, 2.9],
  bench: [0.4, 0.7, 1.0, 1.5, 1.85, 2.2],
  deadlift: [0.75, 1.25, 2.0, 2.5, 3.0, 3.5],
  "overhead-press": [0.25, 0.45, 0.7, 0.9, 1.15, 1.4],
};

const FEMALE_STANDARDS: Record<StandardLift, number[]> = {
  squat: [0.4, 0.7, 1.15, 1.6, 2.0, 2.35],
  bench: [0.25, 0.45, 0.65, 0.95, 1.2, 1.4],
  deadlift: [0.6, 1.0, 1.6, 2.05, 2.5, 2.9],
  "overhead-press": [0.15, 0.3, 0.45, 0.6, 0.75, 0.9],
};

export const LIFT_LABELS: Record<StandardLift, string> = {
  squat: "Squat",
  bench: "Bench Press",
  deadlift: "Deadlift",
  "overhead-press": "Overhead Press",
};

function standardsFor(sex: Sex): Record<StandardLift, number[]> {
  return sex === "male" ? MALE_STANDARDS : FEMALE_STANDARDS;
}

/** Piecewise-linear interpolation of a bodyweight multiplier onto a 0-99.9 percentile. */
export function multiplierToPercentile(multiplier: number, checkpoints: number[]): number {
  if (multiplier <= 0) return 0.5;

  if (multiplier <= checkpoints[0]) {
    const ratio = multiplier / checkpoints[0];
    return Math.max(0.5, PERCENTILE_CHECKPOINTS[0] * ratio);
  }

  for (let i = 0; i < checkpoints.length - 1; i++) {
    const lo = checkpoints[i];
    const hi = checkpoints[i + 1];
    if (multiplier >= lo && multiplier <= hi) {
      const t = (multiplier - lo) / (hi - lo);
      return PERCENTILE_CHECKPOINTS[i] + t * (PERCENTILE_CHECKPOINTS[i + 1] - PERCENTILE_CHECKPOINTS[i]);
    }
  }

  // Beyond the 99th-percentile checkpoint: extrapolate using the final segment's slope, capped.
  const lastIdx = checkpoints.length - 1;
  const slope =
    (PERCENTILE_CHECKPOINTS[lastIdx] - PERCENTILE_CHECKPOINTS[lastIdx - 1]) /
    (checkpoints[lastIdx] - checkpoints[lastIdx - 1]);
  const extra = PERCENTILE_CHECKPOINTS[lastIdx] + slope * (multiplier - checkpoints[lastIdx]);
  return Math.min(99.9, extra);
}

export function percentileToTier(percentile: number): StrengthTier {
  if (percentile < 20) return "Beginner";
  if (percentile < 50) return "Novice";
  if (percentile < 80) return "Intermediate";
  if (percentile < 95) return "Advanced";
  return "Elite";
}

export interface LiftPercentileResult {
  lift: StandardLift;
  multiplier: number;
  percentile: number;
  tier: StrengthTier;
  nextTierMultiplier: number | null;
  nextTier: StrengthTier | null;
}

export function calculateLiftPercentile(
  lift: StandardLift,
  liftWeightKg: number,
  bodyweightKg: number,
  sex: Sex
): LiftPercentileResult {
  const checkpoints = standardsFor(sex)[lift];
  const multiplier = bodyweightKg > 0 ? liftWeightKg / bodyweightKg : 0;
  const percentile = multiplierToPercentile(multiplier, checkpoints);
  const tier = percentileToTier(percentile);

  const tierOrder: StrengthTier[] = ["Beginner", "Novice", "Intermediate", "Advanced", "Elite"];
  const tierIdx = tierOrder.indexOf(tier);
  const nextTier = tierIdx < tierOrder.length - 1 ? tierOrder[tierIdx + 1] : null;
  const nextTierMultiplier = tierIdx < 4 ? checkpoints[tierIdx + 1] * bodyweightKg : null;

  return { lift, multiplier, percentile, tier, nextTierMultiplier, nextTier };
}

// --- DOTS: bodyweight-normalized total score, used for the overall composite percentile ---

const DOTS_COEFFICIENTS: Record<Sex, [number, number, number, number, number]> = {
  male: [-0.0000010930, 0.0007391293, -0.1918759221, 24.0900756, -307.75076],
  female: [-0.0000010706, 0.0005158568, -0.1126655495, 13.6175032, 57.96288],
};

export function calculateDotsScore(totalKg: number, bodyweightKg: number, sex: Sex): number {
  if (bodyweightKg <= 0 || totalKg <= 0) return 0;
  const bw = Math.min(Math.max(bodyweightKg, 40), sex === "male" ? 210 : 150);
  const [a, b, c, d, e] = DOTS_COEFFICIENTS[sex];
  const denom = a * bw ** 4 + b * bw ** 3 + c * bw ** 2 + d * bw + e;
  return (totalKg * 500) / denom;
}

/** DOTS checkpoints at the same percentile grid, approximated from published DOTS distributions. */
const DOTS_CHECKPOINTS = [180, 230, 300, 370, 430, 480];

export function dotsToPercentile(dots: number): number {
  return multiplierToPercentile(dots, DOTS_CHECKPOINTS);
}
