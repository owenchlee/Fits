"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import { isLoggedSet } from "@/lib/calc/load";
import type { AppSettings, Exercise } from "@/lib/db/types";

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

/** IDs of exercises that have at least one logged set, for filtering the library down to "yours". */
export function useLoggedExerciseIds() {
  return (
    useLiveQuery(async () => {
      const [sets, exercises] = await Promise.all([db.sets.toArray(), db.exercises.toArray()]);
      const byId = new Map(exercises.map((e) => [e.id, e]));
      return new Set(sets.filter((s) => isLoggedSet(s, byId.get(s.exerciseId))).map((s) => s.exerciseId));
    }, []) ?? new Set<string>()
  );
}

/** Exercises really logged in completed workouts, most recent first. Walks workouts newest-first and stops at `limit`. */
export function useRecentExercises(limit = 8) {
  return (
    useLiveQuery(async () => {
      const byId = new Map((await db.exercises.toArray()).map((e) => [e.id, e]));
      const out: Exercise[] = [];
      const seen = new Set<string>();
      for (const w of await db.workouts.orderBy("completedAt").reverse().toArray()) {
        if (!w.completedAt) continue;
        const sets = (await db.sets.where("workoutId").equals(w.id).toArray()).sort((a, b) => b.completedAt - a.completedAt);
        for (const s of sets) {
          const ex = byId.get(s.exerciseId);
          if (!ex || seen.has(ex.id) || !isLoggedSet(s, ex)) continue;
          seen.add(ex.id);
          out.push(ex);
        }
        if (out.length >= limit) break;
      }
      return out.slice(0, limit);
    }, []) ?? []
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

