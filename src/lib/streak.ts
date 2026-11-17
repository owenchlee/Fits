import { addDays, dateKey } from "@/lib/date";

/**
 * Consecutive local days with a finished workout, derived from history so deletes and syncs stay
 * truthful. Alive if the newest day is today or yesterday (today's session may not have happened yet).
 */
export function currentStreak(completedAts: readonly number[], now = new Date()): number {
  const days = new Set(completedAts.map((t) => dateKey(new Date(t))));
  let day = days.has(dateKey(now)) ? now : addDays(now, -1);
  let count = 0;
  while (days.has(dateKey(day))) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}
