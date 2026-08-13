import { db } from "@/lib/db/db";
import { slugId } from "@/lib/id";
import { seedExercises } from "@/lib/db/seed-exercises";
import { seedPrograms } from "@/lib/db/seed-programs";
import type { AppSettings, Exercise, Program } from "@/lib/db/types";

let seedPromise: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (!seedPromise) seedPromise = seed();
  return seedPromise;
}

/** Forces the next ensureSeeded() call to re-run, used after a full data reset. */
export function resetSeedState() {
  seedPromise = null;
}

async function seed() {
  const exerciseCount = await db.exercises.count();
  let exercisesByName = new Map<string, Exercise>();

  if (exerciseCount === 0) {
    const now = Date.now();
    const exercises: Exercise[] = seedExercises.map((e) => ({
      ...e,
      // Deterministic (not random) so built-ins line up across devices without needing to sync them.
      id: slugId("ex", e.name),
      isCustom: false,
      updatedAt: now,
    }));
    await db.exercises.bulkAdd(exercises);
    exercisesByName = new Map(exercises.map((e) => [e.name, e]));
  } else {
    const all = await db.exercises.toArray();
    exercisesByName = new Map(all.map((e) => [e.name, e]));
    await backfillBuiltInExercises(exercisesByName);
  }

  const programCount = await db.programs.count();
  if (programCount === 0) {
    const now = Date.now();
    const programs: Program[] = seedPrograms.map((p) => ({
      id: slugId("prog", p.name),
      name: p.name,
      description: p.description,
      author: p.author,
      daysPerWeek: p.daysPerWeek,
      isCustom: false,
      updatedAt: now,
      days: p.days.map((day) => ({
        id: slugId("day", `${p.name}-${day.name}`),
        name: day.name,
        exercises: day.exercises
          .map((ex) => {
            const match = exercisesByName.get(ex.exerciseName);
            if (!match) return null;
            return {
              exerciseId: match.id,
              targetSets: ex.targetSets,
              targetReps: ex.targetReps,
              targetRpe: ex.targetRpe,
              restSeconds: ex.restSeconds,
            };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null),
      })),
    }));
    await db.programs.bulkAdd(programs);
  }

  const settings = await db.settings.get("singleton");
  if (!settings) {
    const defaults: AppSettings = {
      id: "singleton",
      unitSystem: "lb",
      sex: "male",
      bodyweightKg: 80,
      defaultRestSeconds: 120,
      barWeightKg: 20,
      availablePlatesKg: [25, 20, 15, 10, 5, 2.5, 1.25],
      streak: 0,
      updatedAt: Date.now(),
    };
    await db.settings.add(defaults);
  }
}

/**
 * Exercises only bulkAdd once (above), so a profile seeded before a field was added or changed
 * in seed-exercises.ts (e.g. a standardLift/standardLiftRatio backfill, like the one that gave
 * Dumbbell Bench Press etc. their percentile ratios) would otherwise carry stale data forever.
 * Built-ins aren't user-editable, so it's safe to resync every field from the current seed list.
 */
async function backfillBuiltInExercises(exercisesByName: Map<string, Exercise>) {
  const updates: Exercise[] = [];
  for (const seedExercise of seedExercises) {
    const current = exercisesByName.get(seedExercise.name);
    if (!current || current.isCustom) continue;
    const candidate: Exercise = { ...current, ...seedExercise };
    if (JSON.stringify(candidate) !== JSON.stringify(current)) {
      const merged = { ...candidate, updatedAt: Date.now() };
      updates.push(merged);
      exercisesByName.set(seedExercise.name, merged);
    }
  }
  if (updates.length > 0) await db.exercises.bulkPut(updates);
}
