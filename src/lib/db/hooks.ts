"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import type { AppSettings } from "@/lib/db/types";

const FALLBACK_SETTINGS: AppSettings = {
  id: "singleton",
  unitSystem: "lb",
  sex: "male",
  bodyweightKg: 80,
  defaultRestSeconds: 120,
  barWeightKg: 20,
  availablePlatesKg: [25, 20, 15, 10, 5, 2.5, 1.25],
  streak: 0,
  updatedAt: 0,
};

export function useSettings(): AppSettings {
  // Pure read only — liveQuery forbids writes, and ensureSeeded() already
  // guarantees the settings row exists before the UI renders real data.
  const settings = useLiveQuery(() => db.settings.get("singleton"), []);
  return settings ?? FALLBACK_SETTINGS;
}

export function useExercises() {
  return useLiveQuery(() => db.exercises.orderBy("name").toArray(), []) ?? [];
}

export function useExercise(id: string | undefined) {
  return useLiveQuery(() => (id ? db.exercises.get(id) : undefined), [id]);
}

/** IDs of exercises that have at least one logged set, for filtering the library down to "yours". */
export function useLoggedExerciseIds() {
  return (
    useLiveQuery(async () => {
      const ids = await db.sets.orderBy("exerciseId").uniqueKeys();
      return new Set(ids as string[]);
    }, []) ?? new Set<string>()
  );
}

export function usePrograms() {
  return useLiveQuery(() => db.programs.toArray(), []) ?? [];
}

export function useProgram(id: string | undefined) {
  return useLiveQuery(() => (id ? db.programs.get(id) : undefined), [id]);
}

export function useActiveWorkout() {
  return useLiveQuery(() => db.workouts.filter((w) => !w.completedAt).first(), []);
}

export function useWorkoutSets(workoutId: string | undefined) {
  return (
    useLiveQuery(
      () => (workoutId ? db.sets.where("workoutId").equals(workoutId).sortBy("completedAt") : []),
      [workoutId]
    ) ?? []
  );
}

export function useCompletedWorkouts() {
  return (
    useLiveQuery(
      async () => (await db.workouts.filter((w) => !!w.completedAt).sortBy("completedAt")).reverse(),
      []
    ) ?? []
  );
}

export function useBodyMetrics() {
  return useLiveQuery(() => db.bodyMetrics.orderBy("date").reverse().toArray(), []) ?? [];
}

export function usePercentileHistory() {
  return useLiveQuery(() => db.percentileSnapshots.orderBy("date").toArray(), []) ?? [];
}

export function useRecentWorkouts(limit = 20) {
  return (
    useLiveQuery(
      () => db.workouts.orderBy("startedAt").reverse().limit(limit).toArray(),
      [limit]
    ) ?? []
  );
}
