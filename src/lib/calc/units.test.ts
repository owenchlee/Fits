import { test } from "node:test";
import assert from "node:assert/strict";
import { formatWeight, fromDisplayWeight, kgToLb, lbToKg, toDisplayWeight } from "@/lib/calc/units";

const close = (actual: number, expected: number, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < eps, `${actual} != ${expected}`);

test("kgToLb / lbToKg use the exact international pound", () => {
  close(lbToKg(1), 0.45359237);
  close(kgToLb(0.45359237), 1);
  close(kgToLb(100), 220.46226218487757);
  assert.equal(kgToLb(0), 0);
  close(kgToLb(-10), -22.046226218487757);
});

test("kg <-> lb round-trips", () => {
  for (const v of [0, 1, 2.5, 60, 142.5, 1000]) {
    close(lbToKg(kgToLb(v)), v);
    close(kgToLb(lbToKg(v)), v);
  }
});

test("toDisplayWeight / fromDisplayWeight", () => {
  assert.equal(toDisplayWeight(100, "kg"), 100);
  close(toDisplayWeight(100, "lb"), 220.46226218487757);
  assert.equal(fromDisplayWeight(45, "kg"), 45);
  close(fromDisplayWeight(45, "lb"), 20.41165665);
  close(fromDisplayWeight(toDisplayWeight(82.5, "lb"), "lb"), 82.5);
});

test("formatWeight drops decimals for whole numbers and rounds otherwise", () => {
  assert.equal(formatWeight(100, "kg"), "100 kg");
  assert.equal(formatWeight(102.5, "kg"), "102.5 kg");
  assert.equal(formatWeight(102.25, "kg", { decimals: 2 }), "102.25 kg");
  assert.equal(formatWeight(102.26, "kg", { decimals: 0 }), "102 kg");
  assert.equal(formatWeight(100, "lb"), "220.5 lb");
  assert.equal(formatWeight(lbToKg(225), "lb"), "225 lb");
  assert.equal(formatWeight(0, "kg"), "0 kg");
});
