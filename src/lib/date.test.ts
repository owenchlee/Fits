import { test } from "node:test";
import assert from "node:assert/strict";
import {
  WEEKDAY_LABELS,
  addDays,
  dateKey,
  daysBetween,
  isSameDay,
  mondayIndex,
  parseDateKey,
  startOfWeek,
} from "@/lib/date";

// 2024-01-01 was a Monday.
test("WEEKDAY_LABELS starts on Monday", () => {
  assert.deepEqual([...WEEKDAY_LABELS], ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
});

test("mondayIndex maps Mon..Sun to 0..6", () => {
  for (let i = 0; i < 7; i++) assert.equal(mondayIndex(new Date(2024, 0, 1 + i)), i);
  assert.equal(mondayIndex(new Date(2023, 11, 31)), 6); // Sunday
});

test("startOfWeek returns local midnight of the Monday", () => {
  const sunday = new Date(2024, 0, 7, 23, 59, 59, 999);
  assert.equal(startOfWeek(sunday).getTime(), new Date(2024, 0, 1).getTime());
  const monday = new Date(2024, 0, 8, 0, 0, 0, 1);
  assert.equal(startOfWeek(monday).getTime(), new Date(2024, 0, 8).getTime());
  // Crosses a year boundary: Wed 2025-01-01 -> Mon 2024-12-30.
  assert.equal(dateKey(startOfWeek(new Date(2025, 0, 1, 12))), "2024-12-30");
  // Input is not mutated.
  assert.equal(sunday.getHours(), 23);
});

test("addDays handles month/year rollover, negatives and does not mutate", () => {
  const d = new Date(2024, 1, 28, 10);
  assert.equal(dateKey(addDays(d, 1)), "2024-02-29"); // leap year
  assert.equal(dateKey(addDays(d, 2)), "2024-03-01");
  assert.equal(dateKey(addDays(new Date(2024, 0, 1), -1)), "2023-12-31");
  assert.equal(dateKey(addDays(d, 0)), "2024-02-28");
  assert.equal(addDays(d, 1).getHours(), 10);
  assert.equal(dateKey(d), "2024-02-28");
});

test("isSameDay ignores time of day", () => {
  assert.equal(isSameDay(new Date(2024, 4, 5, 0, 0), new Date(2024, 4, 5, 23, 59)), true);
  assert.equal(isSameDay(new Date(2024, 4, 5), new Date(2024, 4, 6)), false);
  assert.equal(isSameDay(new Date(2024, 4, 5), new Date(2024, 5, 5)), false);
  assert.equal(isSameDay(new Date(2024, 4, 5), new Date(2023, 4, 5)), false);
});

test("daysBetween counts calendar days, signed", () => {
  assert.equal(daysBetween(new Date(2024, 0, 1, 23), new Date(2024, 0, 2, 1)), 1);
  assert.equal(daysBetween(new Date(2024, 0, 2), new Date(2024, 0, 1)), -1);
  assert.equal(daysBetween(new Date(2024, 0, 1, 8), new Date(2024, 0, 1, 20)), 0);
  assert.equal(daysBetween(new Date(2024, 0, 1), new Date(2025, 0, 1)), 366);
});

test("dateKey zero-pads and parseDateKey round-trips", () => {
  assert.equal(dateKey(new Date(2024, 2, 5, 23, 30)), "2024-03-05");
  assert.equal(dateKey(new Date(2024, 11, 31)), "2024-12-31");
  const parsed = parseDateKey("2024-03-05");
  assert.equal(parsed.getTime(), new Date(2024, 2, 5).getTime());
  for (const key of ["2024-01-01", "2024-02-29", "1999-12-31"]) assert.equal(dateKey(parseDateKey(key)), key);
});
