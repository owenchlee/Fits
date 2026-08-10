import { db } from "@/lib/db/db";
import { generateId } from "@/lib/id";
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
    const exercises: Exercise[] = seedExercises.map((e) => ({
      ...e,
      id: generateId(),
      isCustom: false,
    }));
    await db.exercises.bulkAdd(exercises);
    exercisesByName = new Map(exercises.map((e) => [e.name, e]));
  } else {
    const all = await db.exercises.toArray();
    exercisesByName = new Map(all.map((e) => [e.name, e]));
  }

  const programCount = await db.programs.count();
  if (programCount === 0) {
    const programs: Program[] = seedPrograms.map((p) => ({
      id: generateId(),
      name: p.name,
      description: p.description,
      author: p.author,
      daysPerWeek: p.daysPerWeek,
      isCustom: false,
      days: p.days.map((day) => ({
        id: generateId(),
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
    };
    await db.settings.add(defaults);
  }
}
