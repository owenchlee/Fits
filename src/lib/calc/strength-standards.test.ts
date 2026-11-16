import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LIFT_LABELS,
  calculateExercisePercentile,
  calculateLiftPercentile,
  multiplierToPercentile,
  percentileToTier,
  totalToPercentile,
} from "@/lib/calc/strength-standards";

const close = (actual: number, expected: number, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < eps, `${actual} != ${expected}`);

// Male squat table: 5/20/50/80/95/99th percentile at these bodyweight multipliers.
const MALE_SQUAT = [0.5, 0.9, 1.5, 2.0, 2.5, 2.9];

test("multiplierToPercentile: zero, negative and below-first-checkpoint", () => {
  assert.equal(multiplierToPercentile(0, MALE_SQUAT), 0.5);
  assert.equal(multiplierToPercentile(-1, MALE_SQUAT), 0.5);
  assert.equal(multiplierToPercentile(0.25, MALE_SQUAT), 2.5);
  // Floored at 0.5 for tiny but positive multipliers.
  assert.equal(multiplierToPercentile(0.02, MALE_SQUAT), 0.5);
  assert.equal(multiplierToPercentile(0.5, MALE_SQUAT), 5);
});

test("multiplierToPercentile: interpolates between checkpoints", () => {
  close(multiplierToPercentile(1.2, MALE_SQUAT), 35);
  assert.equal(multiplierToPercentile(1.5, MALE_SQUAT), 50);
  close(multiplierToPercentile(2.25, MALE_SQUAT), 87.5);
  assert.equal(multiplierToPercentile(2.9, MALE_SQUAT), 99);
});

test("multiplierToPercentile: extrapolates past the top checkpoint, capped at 99.9", () => {
  close(multiplierToPercentile(2.95, MALE_SQUAT), 99.5, 1e-6);
  assert.equal(multiplierToPercentile(3.0, MALE_SQUAT), 99.9);
  assert.equal(multiplierToPercentile(10, MALE_SQUAT), 99.9);
});

test("percentileToTier boundaries", () => {
  assert.equal(percentileToTier(0.5), "Beginner");
  assert.equal(percentileToTier(19.99), "Beginner");
  assert.equal(percentileToTier(20), "Novice");
  assert.equal(percentileToTier(49.9), "Novice");
  assert.equal(percentileToTier(50), "Intermediate");
  assert.equal(percentileToTier(79.9), "Intermediate");
  assert.equal(percentileToTier(80), "Advanced");
  assert.equal(percentileToTier(94.9), "Advanced");
  assert.equal(percentileToTier(95), "Elite");
  assert.equal(percentileToTier(99.9), "Elite");
});

test("LIFT_LABELS", () => {
  assert.equal(LIFT_LABELS.bench, "Bench Press");
  assert.equal(LIFT_LABELS["overhead-press"], "Overhead Press");
});

test("calculateLiftPercentile: male 1x bodyweight bench is the median", () => {
  assert.deepEqual(calculateLiftPercentile("bench", 100, 100, "male"), {
    lift: "bench",
    multiplier: 1,
    percentile: 50,
    tier: "Intermediate",
    nextTier: "Advanced",
    nextTierMultiplier: 150, // 1.5x bodyweight = 80th percentile
    needsBodyweight: false,
  });
});

test("calculateLiftPercentile: female table and beginner tier", () => {
  const median = calculateLiftPercentile("deadlift", 80, 50, "female");
  assert.equal(median.percentile, 50);
  assert.equal(median.tier, "Intermediate");
  close(median.nextTierMultiplier ?? NaN, 102.5); // 2.05 * 50

  const beginner = calculateLiftPercentile("overhead-press", 6, 40, "female"); // 0.15x
  assert.equal(beginner.percentile, 5);
  assert.equal(beginner.tier, "Beginner");
  assert.equal(beginner.nextTier, "Novice");
  close(beginner.nextTierMultiplier ?? NaN, 12); // 0.3 * 40
});

test("calculateLiftPercentile: elite has no next tier", () => {
  const r = calculateLiftPercentile("squat", 250, 100, "male");
  assert.equal(r.percentile, 95);
  assert.equal(r.tier, "Elite");
  assert.equal(r.nextTier, null);
  assert.equal(r.nextTierMultiplier, null);
});

test("calculateLiftPercentile: zero bodyweight does not divide by zero", () => {
  const r = calculateLiftPercentile("squat", 100, 0, "male");
  assert.equal(r.multiplier, 0);
  assert.equal(r.percentile, 0.5);
  assert.equal(r.tier, "Beginner");
});

test("calculateExercisePercentile: anchor lift is direct", () => {
  const r = calculateExercisePercentile(
    { id: "bench", name: "Bench Press", standardLift: "bench" },
    100,
    100,
    "male"
  );
  assert.ok(r);
  assert.equal(r.exerciseId, "bench");
  assert.equal(r.exerciseName, "Bench Press");
  assert.equal(r.isEstimated, false);
  assert.equal(r.estimatedFrom, undefined);
  assert.equal(r.percentile, 50);
});

test("calculateExercisePercentile: ratio converts to anchor-equivalent weight", () => {
  // 50 kg at ratio 0.5 of bench = 100 kg bench equivalent at 100 kg bodyweight.
  const r = calculateExercisePercentile(
    { id: "db-bench", name: "DB Bench", standardLift: null, standardLiftRatio: { basedOn: "bench", ratio: 0.5 } },
    50,
    100,
    "male"
  );
  assert.ok(r);
  assert.equal(r.isEstimated, true);
  assert.deepEqual(r.estimatedFrom, { basedOn: "bench", ratio: 0.5 });
  assert.equal(r.lift, "bench");
  assert.equal(r.multiplier, 0.5); // estimated lifts report their own lift/bodyweight multiplier
  assert.equal(r.percentile, 50);
});

test("calculateExercisePercentile: no standards or non-positive ratio returns null", () => {
  assert.equal(calculateExercisePercentile({ id: "curl", name: "Curl", standardLift: null }, 30, 80, "male"), null);
  assert.equal(
    calculateExercisePercentile(
      { id: "x", name: "X", standardLift: null, standardLiftRatio: { basedOn: "squat", ratio: 0 } },
      30,
      80,
      "male"
    ),
    null
  );
});

test("totalToPercentile: non-positive inputs return 0", () => {
  assert.equal(totalToPercentile(400, 0, "male"), 0);
  assert.equal(totalToPercentile(0, 80, "male"), 0);
  assert.equal(totalToPercentile(-5, 80, "female"), 0);
});

test("totalToPercentile: exact table rows and interpolated bodyweight", () => {
  assert.equal(totalToPercentile(396, 80, "male"), 50);
  assert.equal(totalToPercentile(259, 80, "male"), 5);
  // 77.5 kg sits halfway between the 75 and 80 kg rows: median 384.
  close(totalToPercentile(384, 77.5, "male"), 50);
  close(totalToPercentile(217, 60, "female"), 50);
});

test("totalToPercentile: bodyweight clamps to table ends", () => {
  assert.equal(totalToPercentile(627, 200, "male"), 50); // uses 140 kg row
  assert.equal(totalToPercentile(165, 30, "female"), 50); // uses 40 kg row
  assert.equal(totalToPercentile(270, 40, "female"), 95);
});

test("totalToPercentile: above the 95th checkpoint extrapolates and caps", () => {
  // 140 kg male row: 80th=729, 95th=833 -> slope 15/104 per kg.
  close(totalToPercentile(850, 140, "male"), 95 + (15 * 17) / 104);
  assert.equal(totalToPercentile(2000, 140, "male"), 99.9);
});
