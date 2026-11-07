import { test } from "node:test";
import assert from "node:assert/strict";
import { toTotalLoadKg } from "@/lib/calc/load";

test("bilateral dumbbell entries double to total load", () => {
  assert.equal(toTotalLoadKg(20, { equipment: "dumbbell" }), 40);
  assert.equal(toTotalLoadKg(22.5, { equipment: "dumbbell", isUnilateral: false }), 45);
  assert.equal(toTotalLoadKg(0, { equipment: "dumbbell" }), 0);
});

test("unilateral dumbbell entries pass through unchanged", () => {
  assert.equal(toTotalLoadKg(30, { equipment: "dumbbell", isUnilateral: true }), 30);
});

test("non-dumbbell or missing exercise passes through unchanged", () => {
  assert.equal(toTotalLoadKg(100, { equipment: "barbell" }), 100);
  assert.equal(toTotalLoadKg(100, { equipment: "barbell", isUnilateral: true }), 100);
  assert.equal(toTotalLoadKg(60, null), 60);
  assert.equal(toTotalLoadKg(60, undefined), 60);
});
