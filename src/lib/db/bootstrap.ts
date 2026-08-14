import { db } from "@/lib/db/db";
import { slugId } from "@/lib/id";
import { seedExercises } from "@/lib/db/seed-exercises";
import { seedPrograms } from "@/lib/db/seed-programs";
import { enqueueSync } from "@/lib/sync/outbox";
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
    await promoteMatchingCustomExercises(exercisesByName);
    await addNewSeedExercises(exercisesByName);
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
 * If a seed exercise is later added with the same name as a custom exercise the user already
 * created, treat it as that exercise graduating into the built-in library rather than leaving a
 * duplicate: convert the existing row in place (same id, so workouts/programs referencing it keep
 * working) and adopt the seed's muscle/equipment/standard-lift metadata.
 */
async function promoteMatchingCustomExercises(exercisesByName: Map<string, Exercise>) {
  const seedByNormalizedName = new Map(seedExercises.map((e) => [e.name.toLowerCase().trim(), e]));
  const updates: Exercise[] = [];
  for (const current of Array.from(exercisesByName.values())) {
    if (!current.isCustom) continue;
    const seedMatch = seedByNormalizedName.get(current.name.toLowerCase().trim());
    if (!seedMatch) continue;
    const promoted: Exercise = { ...current, ...seedMatch, isCustom: false, updatedAt: Date.now() };
    updates.push(promoted);
    exercisesByName.set(promoted.name, promoted);
  }
  if (updates.length > 0) {
    await db.exercises.bulkPut(updates);
    for (const u of updates) await enqueueSync("exercises", "upsert", u.id);
  }
}

/**
 * The initial exercises.bulkAdd only ever runs once (exerciseCount === 0 above), so exercises added
 * to seed-exercises.ts later would otherwise never reach a profile that was already seeded. Insert
 * whichever seed entries aren't present yet (by name — promoteMatchingCustomExercises above already
 * claimed any that match an existing custom exercise).
 */
async function addNewSeedExercises(exercisesByName: Map<string, Exercise>) {
  const now = Date.now();
  const additions: Exercise[] = [];
  for (const seedExercise of seedExercises) {
    if (exercisesByName.has(seedExercise.name)) continue;
    const exercise: Exercise = {
      ...seedExercise,
      id: slugId("ex", seedExercise.name),
      isCustom: false,
      updatedAt: now,
    };
    additions.push(exercise);
    exercisesByName.set(exercise.name, exercise);
  }
  if (additions.length > 0) await db.exercises.bulkAdd(additions);
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
