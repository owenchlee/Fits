import { test } from "node:test";
import assert from "node:assert/strict";
import { ordinalSuffix, sanitizeDecimalInput, sanitizeIntegerInput } from "@/lib/format";

test("sanitizeIntegerInput keeps digits only and strips leading zeros", () => {
  assert.equal(sanitizeIntegerInput("12"), "12");
  assert.equal(sanitizeIntegerInput("1a2-3.4"), "1234");
  assert.equal(sanitizeIntegerInput("012"), "12");
  assert.equal(sanitizeIntegerInput("000"), "0");
  assert.equal(sanitizeIntegerInput("0"), "0");
  assert.equal(sanitizeIntegerInput(""), "");
  assert.equal(sanitizeIntegerInput("-5"), "5");
  assert.equal(sanitizeIntegerInput("abc"), "");
});

test("sanitizeDecimalInput keeps a single decimal point", () => {
  assert.equal(sanitizeDecimalInput("12.5"), "12.5");
  assert.equal(sanitizeDecimalInput("1.2.3"), "1.23");
  assert.equal(sanitizeDecimalInput("..5"), ".5");
  assert.equal(sanitizeDecimalInput("7."), "7.");
  assert.equal(sanitizeDecimalInput("12kg"), "12");
  assert.equal(sanitizeDecimalInput("-2.5"), "2.5");
  assert.equal(sanitizeDecimalInput("1,5"), "1.5"); // comma is a decimal separator (EU keyboards)
  assert.equal(sanitizeDecimalInput(""), "");
});

test("sanitizeDecimalInput strips leading zeros but keeps 0 before the point", () => {
  assert.equal(sanitizeDecimalInput("0.5"), "0.5");
  assert.equal(sanitizeDecimalInput("00.5"), "0.5");
  assert.equal(sanitizeDecimalInput("007"), "7");
  assert.equal(sanitizeDecimalInput("0"), "0");
});

test("ordinalSuffix handles st/nd/rd/th and the teens", () => {
  const cases: Array<[number, string]> = [
    [0, "th"], [1, "st"], [2, "nd"], [3, "rd"], [4, "th"], [10, "th"],
    [11, "th"], [12, "th"], [13, "th"], [21, "st"], [22, "nd"], [23, "rd"],
    [101, "st"], [111, "th"], [112, "th"], [113, "th"], [1002, "nd"],
  ];
  for (const [n, suffix] of cases) assert.equal(ordinalSuffix(n), suffix, `n=${n}`);
});

test("ordinalSuffix rounds fractional percentiles first", () => {
  assert.equal(ordinalSuffix(0.6), "st");
  assert.equal(ordinalSuffix(1.4), "st");
  assert.equal(ordinalSuffix(2.5), "rd");
  assert.equal(ordinalSuffix(10.6), "th");
  assert.equal(ordinalSuffix(99.4), "th");
});
