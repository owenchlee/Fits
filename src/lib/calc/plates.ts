export interface PlateBreakdown {
  perSide: number[];
  reachable: boolean;
  actualWeight: number;
}

/**
 * Greedy plate calculator. `availablePlates` and `barWeight` are in the same
 * unit as `targetWeight` (kg or lb — caller decides).
 */
export function calculatePlates(
  targetWeight: number,
  barWeight: number,
  availablePlates: number[]
): PlateBreakdown {
  const perSideTarget = (targetWeight - barWeight) / 2;
  if (perSideTarget <= 0) {
    return { perSide: [], reachable: targetWeight >= barWeight - 0.01, actualWeight: barWeight };
  }

  const sorted = [...availablePlates].sort((a, b) => b - a);
  const perSide: number[] = [];
  let remaining = perSideTarget;
  const EPS = 0.01;

  for (const plate of sorted) {
    while (remaining + EPS >= plate) {
      perSide.push(plate);
      remaining -= plate;
    }
  }

  const actualWeight = barWeight + perSide.reduce((sum, p) => sum + p, 0) * 2;
  return { perSide, reachable: remaining < EPS, actualWeight };
}

/** Generates a warm-up ramp (~40/60/80% of working weight, low reps) ending at the working set. */
export function generateWarmupSets(
  workingWeight: number,
  barWeight: number
): Array<{ percent: number; weight: number; reps: number }> {
  const steps = [
    { percent: 0, reps: 8 },
    { percent: 0.4, reps: 5 },
    { percent: 0.6, reps: 3 },
    { percent: 0.8, reps: 2 },
  ];
  return steps.map((step) => {
    const raw = step.percent === 0 ? barWeight : workingWeight * step.percent;
    const weight = Math.max(barWeight, Math.round(raw / 2.5) * 2.5);
    return { percent: step.percent, weight, reps: step.reps };
  });
}
