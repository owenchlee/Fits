import { test } from "node:test";
import assert from "node:assert/strict";
import { calculatePlates, generateWarmupSets } from "@/lib/calc/plates";
import { PLATE_PRESETS } from "@/lib/calc/plate-presets";

const KG = PLATE_PRESETS.kg;
const LB = PLATE_PRESETS.lb;

test("calculatePlates loads the heaviest plates first", () => {
  assert.deepEqual(calculatePlates(100, KG.bar, KG.plates), {
    perSide: [25, 15],
    reachable: true,
    actualWeight: 100,
  });
  assert.deepEqual(calculatePlates(142.5, KG.bar, KG.plates), {
    perSide: [25, 25, 10, 1.25],
    reachable: true,
    actualWeight: 142.5,
  });
  assert.deepEqual(calculatePlates(225, LB.bar, LB.plates), {
    perSide: [45, 45],
    reachable: true,
    actualWeight: 225,
  });
});

test("calculatePlates sorts unsorted plate lists", () => {
  assert.deepEqual(calculatePlates(90, 20, [5, 25, 10]).perSide, [25, 10]);
});

test("calculatePlates flags weights the plates cannot hit and rounds down", () => {
  assert.deepEqual(calculatePlates(101, KG.bar, KG.plates), {
    perSide: [25, 15],
    reachable: false,
    actualWeight: 100,
  });
  assert.deepEqual(calculatePlates(60, 20, []), { perSide: [], reachable: false, actualWeight: 20 });
});

test("calculatePlates at or below the bar weight", () => {
  assert.deepEqual(calculatePlates(20, KG.bar, KG.plates), { perSide: [], reachable: true, actualWeight: 20 });
  assert.deepEqual(calculatePlates(15, KG.bar, KG.plates), { perSide: [], reachable: false, actualWeight: 20 });
  assert.deepEqual(calculatePlates(0, KG.bar, KG.plates), { perSide: [], reachable: false, actualWeight: 20 });
  assert.deepEqual(calculatePlates(-50, KG.bar, KG.plates), { perSide: [], reachable: false, actualWeight: 20 });
});

test("generateWarmupSets ramps bar, 40%, 60%, 80%", () => {
  assert.deepEqual(generateWarmupSets(100, 20), [
    { percent: 0, weight: 20, reps: 8 },
    { percent: 0.4, weight: 40, reps: 5 },
    { percent: 0.6, weight: 60, reps: 3 },
    { percent: 0.8, weight: 80, reps: 2 },
  ]);
});

test("generateWarmupSets rounds to 2.5 and never goes below the bar", () => {
  // 101 * 0.4 = 40.4 -> 40, 60.6 -> 60, 80.8 -> 80
  assert.deepEqual(
    generateWarmupSets(101, 20).map((s) => s.weight),
    [20, 40, 60, 80]
  );
  // 30 * 0.4 = 12 and 30 * 0.6 = 18 -> clamped to bar; 30 * 0.8 = 24 -> 25
  assert.deepEqual(
    generateWarmupSets(30, 20).map((s) => s.weight),
    [20, 20, 20, 25]
  );
  assert.deepEqual(
    generateWarmupSets(0, 20).map((s) => s.weight),
    [20, 20, 20, 20]
  );
});
