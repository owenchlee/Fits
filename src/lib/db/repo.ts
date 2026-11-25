import { db } from "@/lib/db/db";
import { addDays, dateKey } from "@/lib/date";
import { generateId } from "@/lib/id";
import { recordPercentileSnapshot, refreshSnapshotsFrom } from "@/lib/calc/percentile-snapshot";
import { enqueueSync } from "@/lib/sync/outbox";
import type { AppSettings, BodyMetric, Equipment, Exercise, MuscleGroup, Program, ProgramExercise, SetEntry, Workout } from "@/lib/db/types";

export async function createExercise(data: {
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment;
  isUnilateral?: boolean;
}): Promise<string> {
  const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  const key = norm(data.name);
  // Reuse an existing exercise with the same name so history and charts are not split.
  const existing = (await db.exercises.toArray()).find((e) => norm(e.name) === key);
  if (existing) return existing.id;
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

// Days are looked up by name, so make names unique (case/space-insensitive): 'Day' -> 'Day (2)'.
function uniqueDayNames<T extends { name: string }>(days: T[]): T[] {
  const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  const seen = new Set<string>();
  return days.map((d) => {
    let name = d.name;
    for (let n = 2; seen.has(norm(name)); n++) name = `${d.name.trim()} (${n})`;
    seen.add(norm(name));
    return name === d.name ? d : { ...d, name };
  });
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
    days: uniqueDayNames(data.days).map((d) => ({ id: generateId(), name: d.name, exercises: d.exercises })),
    updatedAt: Date.now(),
  };
  await db.programs.add(program);
  await enqueueSync("programs", "upsert", id);
  return id;
}

export async function updateProgram(id: string, patch: Partial<Program>) {
  if (patch.days) patch = { ...patch, days: uniqueDayNames(patch.days) };
  const old = patch.days ? await db.programs.get(id) : undefined;
  if (old && patch.days) {
    // Days may have been removed or reordered: re-point schedule slots and the next-day pointer by day id.
    const newDays = patch.days;
    const remap = (i: number) => {
      const at = newDays.findIndex((d) => d.id === old.days[i]?.id);
      return at >= 0 ? at : null;
    };
    if (patch.schedule === undefined && old.schedule) {
      patch = { ...patch, schedule: old.schedule.map((s) => (s === null ? null : remap(s))) };
    }
    const settings = await getSettings();
    if (settings.activeProgramId === id) {
      const cur = settings.activeProgramDayIndex ?? 0;
      const next = remap(cur) ?? Math.min(cur, Math.max(newDays.length - 1, 0));
      if (next !== cur) await updateSettings({ activeProgramDayIndex: next });
    }
  }
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

async function getSettings(): Promise<AppSettings> {
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
    exerciseOrder: [...new Set(opts.exerciseOrder ?? [])],
    updatedAt: Date.now(),
  };
  // Only one workout may be in progress: reuse it instead of inserting a second.
  const existing = await db.transaction("rw", db.workouts, async () => {
    const running = await db.workouts.filter((w) => !w.completedAt).first();
    if (running) return running;
    await db.workouts.add(workout);
    return undefined;
  });
  if (existing) return existing.id;
  await enqueueSync("workouts", "upsert", id);
  return id;
}

export async function addExerciseToWorkout(workoutId: string, exerciseId: string) {
  const workout = await db.workouts.get(workoutId);
  if (!workout || workout.completedAt) return;
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

export async function moveExerciseInWorkout(workoutId: string, exerciseId: string, delta: -1 | 1) {
  const workout = await db.workouts.get(workoutId);
  if (!workout || workout.completedAt) return;
  const order = [...workout.exerciseOrder];
  const from = order.indexOf(exerciseId);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= order.length) return;
  [order[from], order[to]] = [order[to]!, order[from]!];
  await db.workouts.update(workoutId, { exerciseOrder: order, updatedAt: Date.now() });
  await enqueueSync("workouts", "upsert", workoutId);
}

/** Puts `newId` in `oldId`'s slot and deletes the old exercise's sets (callers confirm first if any are logged). */
export async function replaceExerciseInWorkout(workoutId: string, oldId: string, newId: string) {
  const workout = await db.workouts.get(workoutId);
  if (!workout || workout.completedAt || oldId === newId) return;
  if (workout.exerciseOrder.includes(newId) || !workout.exerciseOrder.includes(oldId)) return;
  const removed = db.sets.where("workoutId").equals(workoutId).filter((s) => s.exerciseId === oldId);
  const removedSetIds = await removed.primaryKeys();
  await db.transaction("rw", db.workouts, db.sets, async () => {
    await removed.delete();
    await db.workouts.update(workoutId, {
      exerciseOrder: workout.exerciseOrder.map((id) => (id === oldId ? newId : id)),
      updatedAt: Date.now(),
    });
  });
  for (const setId of removedSetIds) await enqueueSync("sets", "delete", String(setId));
  await enqueueSync("workouts", "upsert", workoutId);
}

export async function setActiveProgram(programId: string | undefined) {
  await updateSettings({ activeProgramId: programId, activeProgramDayIndex: 0 });
}

async function advanceProgramDay(totalDays: number, fromIndex?: number) {
  const settings = await getSettings();
  const next = ((fromIndex ?? settings.activeProgramDayIndex ?? 0) + 1) % Math.max(totalDays, 1);
  await updateSettings({ activeProgramDayIndex: next });
}

export async function discardWorkout(workoutId: string) {
  // A finished workout is history; deleting it goes through deleteWorkout.
  if ((await db.workouts.get(workoutId))?.completedAt) return;
  const setIds = await db.sets.where("workoutId").equals(workoutId).primaryKeys();
  await db.transaction("rw", db.workouts, db.sets, async () => {
    await db.sets.where("workoutId").equals(workoutId).delete();
    await db.workouts.delete(workoutId);
  });
  for (const setId of setIds) await enqueueSync("sets", "delete", String(setId));
  await enqueueSync("workouts", "delete", workoutId);
}

/**
 * Sets that were pre-filled as blanks (see ExerciseSessionCard) but never logged — no reps
 * entered. Dropped when a workout is finished so history and stats only show what was done.
 */
export async function getUnloggedSets(workoutId: string): Promise<SetEntry[]> {
  return db.sets
    .where("workoutId")
    .equals(workoutId)
    .filter((s) => s.reps <= 0)
    .toArray();
}

export async function completeWorkout(workoutId: string) {
  const workout = await db.workouts.get(workoutId);
  // Already finished (double tap, second tab): don't re-stamp, re-prune or advance the program twice.
  if (!workout || workout.completedAt) return;
  // Nothing logged: leave the workout open so no empty session, streak bump or program skip is recorded.
  if ((await db.sets.where("workoutId").equals(workoutId).filter((s) => s.reps > 0).count()) === 0) return;

  const unlogged = await getUnloggedSets(workoutId);
  await db.sets.bulkDelete(unlogged.map((s) => s.id));
  for (const s of unlogged) await enqueueSync("sets", "delete", s.id);
  // Exercises added but never logged would otherwise show up in history as empty cards.
  const loggedExerciseIds = new Set(
    (await db.sets.where("workoutId").equals(workoutId).toArray()).map((s) => s.exerciseId)
  );
  const exerciseOrder = workout.exerciseOrder.filter((id) => loggedExerciseIds.has(id));

  await db.workouts.update(workoutId, { completedAt: Date.now(), exerciseOrder, updatedAt: Date.now() });
  // The outbox write and the snapshot touch different tables, so run them together.
  await Promise.all([enqueueSync("workouts", "upsert", workoutId), recordPercentileSnapshot()]);

  const settings = await getSettings();

  // Sequential programs (no cycle schedule) advance to the next day automatically.
  // Scheduled programs derive "today's day" from the cycle instead, so no index to advance.
  if (workout.programId && settings.activeProgramId === workout.programId) {
    const program = await db.programs.get(workout.programId);
    if (program && !program.schedule) {
      const done = program.days.findIndex((d) => d.name === workout.programDayName);
      await advanceProgramDay(program.days.length, done >= 0 ? done : undefined);
    }
  }

  // Local calendar days — a 9pm workout in New York belongs to today, not tomorrow's UTC date.
  const today = dateKey(new Date());
  const yesterday = dateKey(addDays(new Date(), -1));

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
  const existing = await db.sets
    .where("workoutId")
    .equals(entry.workoutId)
    .filter((s) => s.exerciseId === entry.exerciseId)
    .toArray();
  const nextIndex = existing.reduce((m, s) => Math.max(m, s.setIndex + 1), 0);

  const id = generateId();
  const set: SetEntry = {
    id,
    workoutId: entry.workoutId,
    exerciseId: entry.exerciseId,
    setIndex: nextIndex,
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
  // Only a finished workout feeds the percentile history; typing into a live one must not touch it.
  const set = await db.sets.get(id);
  const done = set && (await db.workouts.get(set.workoutId))?.completedAt;
  if (done) await refreshSnapshotsFrom(done);
}

export async function updateWorkoutNotes(id: string, notes: string) {
  await db.workouts.update(id, { notes, updatedAt: Date.now() });
  await enqueueSync("workouts", "upsert", id);
}

export async function deleteSet(id: string) {
  await db.sets.delete(id);
  await enqueueSync("sets", "delete", id);
}

export async function getLastPerformance(
  exerciseId: string,
  excludeWorkoutId?: string
): Promise<SetEntry[]> {
  // Find the latest workout in one pass (strict > keeps the first of ties, like the old stable sort).
  let last: SetEntry | undefined;
  for (const s of await db.sets.where("exerciseId").equals(exerciseId).toArray()) {
    if (s.workoutId !== excludeWorkoutId && (!last || s.completedAt > last.completedAt)) last = s;
  }
  if (!last) return [];
  const lastWorkoutId = last.workoutId;
  const sets = await db.sets
    .where("workoutId")
    .equals(lastWorkoutId)
    .filter((s) => s.exerciseId === exerciseId)
    .toArray();
  return sets.sort((a, b) => a.setIndex - b.setIndex);
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

/** Workouts that were actually finished — in-progress and discarded sessions don't count toward stats. */
export async function getCompletedWorkouts(): Promise<Workout[]> {
  return db.workouts.filter((w) => !!w.completedAt).toArray();
}

/** Sets belonging only to completed workouts, so an in-progress session's sets don't inflate stats. */
export async function getCompletedSets(): Promise<SetEntry[]> {
  // Bulk getAll + in-memory filter is much cheaper than a per-row cursor callback; both reads run concurrently.
  const [completed, sets] = await Promise.all([getCompletedWorkouts(), db.sets.toArray()]);
  const completedIds = new Set(completed.map((w) => w.id));
  return sets.filter((s) => completedIds.has(s.workoutId));
}

export async function exportAllData() {
  const [exercises, programs, workouts, sets, bodyMetrics, percentileSnapshots, settings] = await Promise.all([
    db.exercises.toArray(),
    db.programs.toArray(),
    db.workouts.toArray(),
    db.sets.toArray(),
    db.bodyMetrics.toArray(),
    db.percentileSnapshots.toArray(),
    getSettings(),
  ]);
  return {
    app: "Fits",
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    /** Weights are always stored in kilograms, regardless of the display unit in settings. */
    weightUnit: "kg",
    exercises,
    programs,
    workouts,
    sets,
    bodyMetrics,
    percentileSnapshots,
    settings,
  };
}

export async function resetAllData() {
  await db.transaction(
    "rw",
    [db.exercises, db.programs, db.workouts, db.sets, db.bodyMetrics, db.percentileSnapshots, db.settings, db.syncOutbox],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.programs.clear(),
        db.workouts.clear(),
        db.sets.clear(),
        db.bodyMetrics.clear(),
        db.percentileSnapshots.clear(),
        db.settings.clear(),
        db.syncOutbox.clear(),
      ]);
    }
  );
}

export async function deleteWorkout(workoutId: string) {
  const completedAt = (await db.workouts.get(workoutId))?.completedAt;
  const setIds = await db.sets.where("workoutId").equals(workoutId).primaryKeys();
  await db.transaction("rw", db.workouts, db.sets, async () => {
    await db.sets.where("workoutId").equals(workoutId).delete();
    await db.workouts.delete(workoutId);
  });
  for (const setId of setIds) await enqueueSync("sets", "delete", String(setId));
  await enqueueSync("workouts", "delete", workoutId);
  if (completedAt) await refreshSnapshotsFrom(completedAt);
}
