import { daysBetween, mondayIndex, parseDateKey } from "@/lib/date";
import type { Program } from "@/lib/db/types";

/**
 * Resolves which program day (or rest, via null) is due on `date`. `schedule` repeats as a
 * rolling cycle of length `schedule.length` anchored at `cycleStartDate` — e.g. a 4-entry
 * [Push, Pull, Legs, Rest] schedule keeps rotating every 4 days regardless of weekday.
 * Schedules saved before cycles existed have no `cycleStartDate`; those fall back to the
 * original Monday-first weekly reading so they keep working unchanged.
 */
// A slot naming a day that no longer exists is a rest day.
function validSlot(p: Pick<Program, "days">, v: number | null | undefined): number | null {
  return v != null && v >= 0 && v < (p.days.length) ? v : null;
}

export function scheduledDayIndexFor(
  program: Pick<Program, "schedule" | "cycleStartDate" | "days">,
  date: Date
): number | null | undefined {
  const { schedule, cycleStartDate } = program;
  if (!schedule || schedule.length === 0) return undefined;
  if (!cycleStartDate) return validSlot(program, schedule[mondayIndex(date)]);

  const offset = daysBetween(parseDateKey(cycleStartDate), date);
  if (offset < 0) return null; // before the cycle started: nothing is due
  return validSlot(program, schedule[offset % schedule.length]);
}
