import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateWarmupSet } from "@/lib/calc/warmup";
import type { SetEntry } from "@/lib/db/types";

const set = (weightKg: number, reps: number, isWarmup = false): SetEntry => ({
  id: `s-${weightKg}-${reps}`,
  workoutId: "w",
  exerciseId: "e",
  setIndex: 0,
  weightKg,
  reps,
  isWarmup,
  isFailure: false,
  isDropSet: false,
  completedAt: 0,
  updatedAt: 0,
});

test("returns null without usable working sets", () => {
  assert.equal(calculateWarmupSet([]), null);
  assert.equal(calculateWarmupSet([set(100, 5, true), set(0, 5), set(-10, 5), set(80, 0)]), null);
});

test("kg mode halves the top set and rounds to 2.5 kg, reps at least 10", () => {
  assert.deepEqual(calculateWarmupSet([set(80, 8), set(101, 3), set(200, 5, true)]), { weightKg: 50, reps: 10 });
  assert.deepEqual(calculateWarmupSet([set(60, 12)], "kg"), { weightKg: 30, reps: 12 });
});

test("floors tiny loads at 2.5", () => {
  assert.deepEqual(calculateWarmupSet([set(1, 5)]), { weightKg: 2.5, reps: 10 });
});

test("lb mode rounds to 5 lb and converts back to kg", () => {
  // 100 kg = 220.46 lb, half = 110.23 -> 110 lb = 49.8951607 kg
  const r = calculateWarmupSet([set(100, 5)], "lb");
  assert.ok(r);
  assert.equal(r.reps, 10);
  assert.ok(Math.abs(r.weightKg - 110 * 0.45359237) < 1e-9, String(r.weightKg));
});
