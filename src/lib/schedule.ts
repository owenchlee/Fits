import { daysBetween, mondayIndex, parseDateKey } from "@/lib/date";
import type { Program } from "@/lib/db/types";

/**
 * Resolves which program day (or rest, via null) is due on `date`. `schedule` repeats as a
 * rolling cycle of length `schedule.length` anchored at `cycleStartDate` — e.g. a 4-entry
 * [Push, Pull, Legs, Rest] schedule keeps rotating every 4 days regardless of weekday.
 * Schedules saved before cycles existed have no `cycleStartDate`; those fall back to the
 * original Monday-first weekly reading so they keep working unchanged.
 */
export function scheduledDayIndexFor(
  program: Pick<Program, "schedule" | "cycleStartDate">,
  date: Date
): number | null | undefined {
  const { schedule, cycleStartDate } = program;
  if (!schedule || schedule.length === 0) return undefined;
  if (!cycleStartDate) return schedule[mondayIndex(date)] ?? null;

  const offset = daysBetween(parseDateKey(cycleStartDate), date);
  const i = ((offset % schedule.length) + schedule.length) % schedule.length;
  return schedule[i] ?? null;
}
