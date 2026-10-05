import { addDays, dateKey } from "@/lib/date";
import type { AppSettings } from "@/lib/db/types";

/**
 * The stored streak only changes when a workout is finished, so on its own it would keep showing
 * "12 days" long after training stopped. A streak is still alive if the last workout was today or
 * yesterday (today's session may not have happened yet); otherwise it has lapsed to 0.
 */
export function currentStreak(settings: Pick<AppSettings, "streak" | "lastWorkoutDate">, now = new Date()): number {
  if (!settings.lastWorkoutDate) return 0;
  const alive = settings.lastWorkoutDate === dateKey(now) || settings.lastWorkoutDate === dateKey(addDays(now, -1));
  return alive ? settings.streak : 0;
}
