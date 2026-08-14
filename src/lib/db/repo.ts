import { db } from "@/lib/db/db";
import { generateId } from "@/lib/id";
import { recordPercentileSnapshot } from "@/lib/calc/percentile-snapshot";
import { enqueueSync } from "@/lib/sync/outbox";
import type { AppSettings, BodyMetric, Equipment, Exercise, MuscleGroup, Program, ProgramExercise, SetEntry, Workout } from "@/lib/db/types";

export async function createExercise(data: {
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment;
  isUnilateral?: boolean;
}): Promise<string> {
  const id = generateId();
  const exercise: Exercise = {
    id,
    name: data.name,
    primaryMuscle: data.primaryMuscle,
    secondaryMuscles: data.secondaryMuscles ?? [],
    equipment: data.equipment,
    isUnilateral: data.isUnilateral,
    isCustom: true,
    standardLift: null,
    updatedAt: Date.now(),
  };
  await db.exercises.add(exercise);
  await enqueueSync("exercises", "upsert", id);
  return id;
}

export async function createCustomProgram(data: {
  name: string;
  description: string;
  days: Array<{ name: string; exercises: ProgramExercise[] }>;
}): Promise<string> {
  const id = generateId();
  const program: Program = {
    id,
    name: data.name,
    description: data.description,
    author: "You",
    isCustom: true,
    daysPerWeek: data.days.length,
    days: data.days.map((d) => ({ id: generateId(), name: d.name, exercises: d.exercises })),
    updatedAt: Date.now(),
  };
  await db.programs.add(program);
  await enqueueSync("programs", "upsert", id);
  return id;
}

export async function updateProgram(id: string, patch: Partial<Program>) {
  await db.programs.update(id, { ...patch, updatedAt: Date.now() });
  await enqueueSync("programs", "upsert", id);
}

export async function deleteProgram(id: string) {
  await db.programs.delete(id);
  await enqueueSync("programs", "delete", id);
  const settings = await getSettings();
  if (settings.activeProgramId === id) await updateSettings({ activeProgramId: undefined, activeProgramDayIndex: 0 });
}

export async function hideProgram(id: string) {
  const settings = await getSettings();
  const hidden = settings.hiddenProgramIds ?? [];
  if (!hidden.includes(id)) await updateSettings({ hiddenProgramIds: [...hidden, id] });
  if (settings.activeProgramId === id) await updateSettings({ activeProgramId: undefined, activeProgramDayIndex: 0 });
}

export async function restoreProgram(id: string) {
  const settings = await getSettings();
  const hidden = settings.hiddenProgramIds ?? [];
  await updateSettings({ hiddenProgramIds: hidden.filter((h) => h !== id) });
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get("singleton");
  if (settings) return settings;
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
  return defaults;
}

export async function updateSettings(patch: Partial<AppSettings>) {
  await db.settings.update("singleton", { ...patch, updatedAt: Date.now() });
  await enqueueSync("settings", "upsert", "singleton");
}

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export async function startWorkout(opts: {
  programId?: string;
  programDayName?: string;
  title: string;
  exerciseOrder?: string[];
}): Promise<string> {
  const id = generateId();
  const workout: Workout = {
    id,
    programId: opts.programId,
    programDayName: opts.programDayName,
    title: opts.title,
    startedAt: Date.now(),
    exerciseOrder: opts.exerciseOrder ?? [],
    updatedAt: Date.now(),
  };
  await db.workouts.add(workout);
  await enqueueSync("workouts", "upsert", id);
  return id;
}

export async function addExerciseToWorkout(workoutId: string, exerciseId: string) {
  const workout = await db.workouts.get(workoutId);
  if (!workout) return;
  if (workout.exerciseOrder.includes(exerciseId)) return;
  await db.workouts.update(workoutId, {
    exerciseOrder: [...workout.exerciseOrder, exerciseId],
    updatedAt: Date.now(),
  });
  await enqueueSync("workouts", "upsert", workoutId);
}

export async function removeExerciseFromWorkout(workoutId: string, exerciseId: string) {
  const workout = await db.workouts.get(workoutId);
  if (!workout) return;
  const removedSetIds = await db.sets
    .where("workoutId")
    .equals(workoutId)
    .filter((s) => s.exerciseId === exerciseId)
    .primaryKeys();
  await db.transaction("rw", db.workouts, db.sets, async () => {
    await db.sets
      .where("workoutId")
      .equals(workoutId)
      .filter((s) => s.exerciseId === exerciseId)
      .delete();
    await db.workouts.update(workoutId, {
      exerciseOrder: workout.exerciseOrder.filter((id) => id !== exerciseId),
      updatedAt: Date.now(),
    });
  });
  for (const setId of removedSetIds) await enqueueSync("sets", "delete", String(setId));
  await enqueueSync("workouts", "upsert", workoutId);
}

export async function setActiveProgram(programId: string | undefined) {
  await updateSettings({ activeProgramId: programId, activeProgramDayIndex: 0 });
}

export async function advanceProgramDay(totalDays: number) {
  const settings = await getSettings();
  const next = ((settings.activeProgramDayIndex ?? 0) + 1) % Math.max(totalDays, 1);
  await updateSettings({ activeProgramDayIndex: next });
}

export async function getActiveWorkout(): Promise<Workout | undefined> {
  return db.workouts.filter((w) => !w.completedAt).first();
}

export async function discardWorkout(workoutId: string) {
  const setIds = await db.sets.where("workoutId").equals(workoutId).primaryKeys();
  await db.transaction("rw", db.workouts, db.sets, async () => {
    await db.sets.where("workoutId").equals(workoutId).delete();
    await db.workouts.delete(workoutId);
  });
  for (const setId of setIds) await enqueueSync("sets", "delete", String(setId));
  await enqueueSync("workouts", "delete", workoutId);
}

export async function completeWorkout(workoutId: string) {
  const workout = await db.workouts.get(workoutId);
  await db.workouts.update(workoutId, { completedAt: Date.now(), updatedAt: Date.now() });
  await enqueueSync("workouts", "upsert", workoutId);
  await recordPercentileSnapshot();

  const settings = await getSettings();

  // Sequential programs (no cycle schedule) advance to the next day automatically.
  // Scheduled programs derive "today's day" from the cycle instead, so no index to advance.
  if (workout?.programId && settings.activeProgramId === workout.programId) {
    const program = await db.programs.get(workout.programId);
    if (program && !program.schedule) {
      await advanceProgramDay(program.days.length);
    }
  }

  const today = todayKey();
  const yesterday = todayKey(new Date(Date.now() - 86400000));

  if (settings.lastWorkoutDate === today) {
    // already counted today
    return;
  }
  const nextStreak = settings.lastWorkoutDate === yesterday ? settings.streak + 1 : 1;
  await updateSettings({ streak: nextStreak, lastWorkoutDate: today });
}

export async function addSet(entry: {
  workoutId: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  rpe?: number;
  isWarmup?: boolean;
  isFailure?: boolean;
  isDropSet?: boolean;
}): Promise<string> {
  const existingCount = await db.sets
    .where("workoutId")
    .equals(entry.workoutId)
    .filter((s) => s.exerciseId === entry.exerciseId)
    .count();

  const id = generateId();
  const set: SetEntry = {
    id,
    workoutId: entry.workoutId,
    exerciseId: entry.exerciseId,
    setIndex: existingCount,
    weightKg: entry.weightKg,
    reps: entry.reps,
    rpe: entry.rpe,
    isWarmup: entry.isWarmup ?? false,
    isFailure: entry.isFailure ?? false,
    isDropSet: entry.isDropSet ?? false,
    completedAt: Date.now(),
    updatedAt: Date.now(),
  };
  await db.sets.add(set);
  await enqueueSync("sets", "upsert", id);
  return id;
}

export async function updateSet(id: string, patch: Partial<SetEntry>) {
  await db.sets.update(id, { ...patch, updatedAt: Date.now() });
  await enqueueSync("sets", "upsert", id);
}

export async function deleteSet(id: string) {
  await db.sets.delete(id);
  await enqueueSync("sets", "delete", id);
}

export async function getLastPerformance(
  exerciseId: string,
  excludeWorkoutId?: string
): Promise<SetEntry[]> {
  const sets = await db.sets
    .where("exerciseId")
    .equals(exerciseId)
    .filter((s) => s.workoutId !== excludeWorkoutId)
    .toArray();
  if (sets.length === 0) return [];
  const lastWorkoutId = sets.sort((a, b) => b.completedAt - a.completedAt)[0].workoutId;
  return sets
    .filter((s) => s.workoutId === lastWorkoutId)
    .sort((a, b) => a.setIndex - b.setIndex);
}

export async function logBodyMetric(metric: Omit<BodyMetric, "id" | "updatedAt">): Promise<string> {
  const id = generateId();
  await db.bodyMetrics.add({ ...metric, id, updatedAt: Date.now() });
  await enqueueSync("bodyMetrics", "upsert", id);
  if (metric.weightKg) await updateSettings({ bodyweightKg: metric.weightKg });
  return id;
}

export async function deleteBodyMetric(id: string) {
  await db.bodyMetrics.delete(id);
  await enqueueSync("bodyMetrics", "delete", id);
}

export async function getWorkoutsInRange(startMs: number, endMs: number): Promise<Workout[]> {
  return db.workouts
    .filter((w) => (w.completedAt ?? w.startedAt) >= startMs && (w.completedAt ?? w.startedAt) <= endMs)
    .toArray();
}

/** Workouts that were actually finished — in-progress and discarded sessions don't count toward stats. */
export async function getCompletedWorkouts(): Promise<Workout[]> {
  return db.workouts.filter((w) => !!w.completedAt).toArray();
}

/** Sets belonging only to completed workouts, so an in-progress session's sets don't inflate stats. */
export async function getCompletedSets(): Promise<SetEntry[]> {
  const completed = await getCompletedWorkouts();
  const completedIds = new Set(completed.map((w) => w.id));
  return db.sets.filter((s) => completedIds.has(s.workoutId)).toArray();
}

export async function exportAllData() {
  const [exercises, programs, workouts, sets, bodyMetrics, settings] = await Promise.all([
    db.exercises.toArray(),
    db.programs.toArray(),
    db.workouts.toArray(),
    db.sets.toArray(),
    db.bodyMetrics.toArray(),
    getSettings(),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    exercises,
    programs,
    workouts,
    sets,
    bodyMetrics,
    settings,
  };
}

export async function resetAllData() {
  await db.transaction(
    "rw",
    [db.exercises, db.programs, db.workouts, db.sets, db.bodyMetrics, db.settings, db.syncOutbox],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.programs.clear(),
        db.workouts.clear(),
        db.sets.clear(),
        db.bodyMetrics.clear(),
        db.settings.clear(),
        db.syncOutbox.clear(),
      ]);
    }
  );
}

export async function deleteWorkout(workoutId: string) {
  const setIds = await db.sets.where("workoutId").equals(workoutId).primaryKeys();
  await db.transaction("rw", db.workouts, db.sets, async () => {
    await db.sets.where("workoutId").equals(workoutId).delete();
    await db.workouts.delete(workoutId);
  });
  for (const setId of setIds) await enqueueSync("sets", "delete", String(setId));
  await enqueueSync("workouts", "delete", workoutId);
}
