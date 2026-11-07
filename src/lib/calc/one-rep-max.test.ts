import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateOneRepMax, weightForReps } from "@/lib/calc/one-rep-max";

const close = (actual: number, expected: number, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < eps, `${actual} != ${expected}`);

test("estimateOneRepMax applies Epley", () => {
  assert.equal(estimateOneRepMax(100, 1), 100);
  close(estimateOneRepMax(100, 3), 110);
  close(estimateOneRepMax(90, 6), 108);
  close(estimateOneRepMax(100, 12), 140);
});

test("estimateOneRepMax clamps reps above 12", () => {
  close(estimateOneRepMax(100, 20), 140);
  assert.equal(estimateOneRepMax(100, 50), estimateOneRepMax(100, 12));
});

test("estimateOneRepMax returns 0 for non-positive weight or reps", () => {
  assert.equal(estimateOneRepMax(0, 5), 0);
  assert.equal(estimateOneRepMax(-20, 5), 0);
  assert.equal(estimateOneRepMax(100, 0), 0);
  assert.equal(estimateOneRepMax(100, -1), 0);
});

test("weightForReps inverts Epley", () => {
  close(weightForReps(110, 3), 100);
  assert.equal(weightForReps(140, 1), 140);
  assert.equal(weightForReps(140, 0), 140);
  for (const reps of [2, 5, 8, 12]) {
    close(weightForReps(estimateOneRepMax(80, reps), reps), 80);
  }
});
