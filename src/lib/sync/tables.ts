import type { Database } from "@/lib/supabase/types";
import type { AppSettings, BodyMetric, Exercise, PercentileSnapshot, Program, SetEntry, Workout } from "@/lib/db/types";

export type SyncTable = "exercises" | "programs" | "workouts" | "sets" | "bodyMetrics" | "percentileSnapshots";

export const SYNC_TABLES: SyncTable[] = ["exercises", "programs", "workouts", "sets", "bodyMetrics", "percentileSnapshots"];

/** Dexie table name -> Supabase table name. */
export const REMOTE_TABLE: Record<SyncTable, keyof Database["public"]["Tables"]> = {
  exercises: "exercises",
  programs: "programs",
  workouts: "workouts",
  sets: "sets",
  bodyMetrics: "body_metrics",
  percentileSnapshots: "percentile_snapshots",
};

const iso = (ms: number) => new Date(ms).toISOString();
const ms = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : Date.now());

// --- Exercises (only isCustom ones are ever synced — see shouldSyncExercise) ---

export function exerciseToRow(e: Exercise, userId: string): Database["public"]["Tables"]["exercises"]["Insert"] {
  return {
    id: e.id,
    user_id: userId,
    name: e.name,
    primary_muscle: e.primaryMuscle,
    secondary_muscles: e.secondaryMuscles,
    equipment: e.equipment,
    is_custom: e.isCustom,
    standard_lift: e.standardLift,
    standard_lift_ratio: e.standardLiftRatio ?? null,
    notes: e.notes ?? null,
    updated_at: iso(e.updatedAt),
  };
}

export function rowToExercise(r: Database["public"]["Tables"]["exercises"]["Row"]): Exercise {
  return {
    id: r.id,
    name: r.name,
    primaryMuscle: r.primary_muscle as Exercise["primaryMuscle"],
    secondaryMuscles: r.secondary_muscles as Exercise["secondaryMuscles"],
    equipment: r.equipment as Exercise["equipment"],
    isCustom: r.is_custom,
    standardLift: r.standard_lift as Exercise["standardLift"],
    standardLiftRatio: (r.standard_lift_ratio as Exercise["standardLiftRatio"]) ?? undefined,
    notes: r.notes ?? undefined,
    updatedAt: ms(r.updated_at),
  };
}

/** Built-ins are deterministically re-seeded per device (see bootstrap.ts) — never sync them. */
export const shouldSyncExercise = (e: Exercise) => e.isCustom;

// --- Programs (only custom ones sync, same reasoning as exercises) ---

export function programToRow(p: Program, userId: string): Database["public"]["Tables"]["programs"]["Insert"] {
  return {
    id: p.id,
    user_id: userId,
    name: p.name,
    description: p.description,
    author: p.author,
    days_per_week: p.daysPerWeek,
    is_custom: p.isCustom,
    days: p.days,
    updated_at: iso(p.updatedAt),
  };
}

export function rowToProgram(r: Database["public"]["Tables"]["programs"]["Row"]): Program {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    author: r.author,
    daysPerWeek: r.days_per_week,
    isCustom: r.is_custom,
    days: r.days as Program["days"],
    updatedAt: ms(r.updated_at),
  };
}

export const shouldSyncProgram = (p: Program) => p.isCustom;

// --- Workouts ---

export function workoutToRow(w: Workout, userId: string): Database["public"]["Tables"]["workouts"]["Insert"] {
  return {
    id: w.id,
    user_id: userId,
    program_id: w.programId ?? null,
    program_day_name: w.programDayName ?? null,
    title: w.title,
    started_at: iso(w.startedAt),
    completed_at: w.completedAt ? iso(w.completedAt) : null,
    notes: w.notes ?? null,
    bodyweight_kg: w.bodyweightKg ?? null,
    exercise_order: w.exerciseOrder,
    updated_at: iso(w.updatedAt),
  };
}

export function rowToWorkout(r: Database["public"]["Tables"]["workouts"]["Row"]): Workout {
  return {
    id: r.id,
    programId: r.program_id ?? undefined,
    programDayName: r.program_day_name ?? undefined,
    title: r.title,
    startedAt: ms(r.started_at),
    completedAt: r.completed_at ? ms(r.completed_at) : undefined,
    notes: r.notes ?? undefined,
    bodyweightKg: r.bodyweight_kg ?? undefined,
    exerciseOrder: r.exercise_order,
    updatedAt: ms(r.updated_at),
  };
}

// --- Sets ---

export function setToRow(s: SetEntry, userId: string): Database["public"]["Tables"]["sets"]["Insert"] {
  return {
    id: s.id,
    user_id: userId,
    workout_id: s.workoutId,
    exercise_id: s.exerciseId,
    set_index: s.setIndex,
    weight_kg: s.weightKg,
    reps: s.reps,
    rpe: s.rpe ?? null,
    is_warmup: s.isWarmup,
    is_failure: s.isFailure,
    is_drop_set: s.isDropSet,
    completed_at: iso(s.completedAt),
    updated_at: iso(s.updatedAt),
  };
}

export function rowToSet(r: Database["public"]["Tables"]["sets"]["Row"]): SetEntry {
  return {
    id: r.id,
    workoutId: r.workout_id,
    exerciseId: r.exercise_id,
    setIndex: r.set_index,
    weightKg: r.weight_kg,
    reps: r.reps,
    rpe: r.rpe ?? undefined,
    isWarmup: r.is_warmup,
    isFailure: r.is_failure,
    isDropSet: r.is_drop_set,
    completedAt: ms(r.completed_at),
    updatedAt: ms(r.updated_at),
  };
}

// --- Body metrics ---

export function bodyMetricToRow(
  b: BodyMetric,
  userId: string
): Database["public"]["Tables"]["body_metrics"]["Insert"] {
  return {
    id: b.id,
    user_id: userId,
    date: new Date(b.date).toISOString().slice(0, 10),
    weight_kg: b.weightKg ?? null,
    body_fat_pct: b.bodyFatPct ?? null,
    measurements: b.measurements ?? null,
    updated_at: iso(b.updatedAt),
  };
}

export function rowToBodyMetric(r: Database["public"]["Tables"]["body_metrics"]["Row"]): BodyMetric {
  return {
    id: r.id,
    date: new Date(r.date).getTime(),
    weightKg: r.weight_kg ?? undefined,
    bodyFatPct: r.body_fat_pct ?? undefined,
    measurements: (r.measurements as BodyMetric["measurements"]) ?? undefined,
    updatedAt: ms(r.updated_at),
  };
}

// --- Percentile snapshots ---

export function percentileSnapshotToRow(
  p: PercentileSnapshot,
  userId: string
): Database["public"]["Tables"]["percentile_snapshots"]["Insert"] {
  return {
    id: p.id,
    user_id: userId,
    date: p.date,
    overall_percentile: p.overallPercentile,
    per_lift: p.perLift,
    updated_at: iso(p.updatedAt),
  };
}

export function rowToPercentileSnapshot(
  r: Database["public"]["Tables"]["percentile_snapshots"]["Row"]
): PercentileSnapshot {
  return {
    id: r.id,
    date: r.date,
    overallPercentile: r.overall_percentile,
    perLift: r.per_lift,
    updatedAt: ms(r.updated_at),
  };
}

// --- Profile (settings singleton) ---

export function settingsToProfileRow(
  s: AppSettings,
  userId: string
): Database["public"]["Tables"]["profiles"]["Insert"] {
  return {
    id: userId,
    unit_system: s.unitSystem,
    sex: s.sex,
    bodyweight_kg: s.bodyweightKg,
    default_rest_seconds: s.defaultRestSeconds,
    bar_weight_kg: s.barWeightKg,
    available_plates_kg: s.availablePlatesKg,
    streak: s.streak,
    last_workout_date: s.lastWorkoutDate ?? null,
    active_program_id: s.activeProgramId ?? null,
    active_program_day_index: s.activeProgramDayIndex ?? null,
    updated_at: iso(s.updatedAt),
  };
}

export function profileRowToSettings(r: Database["public"]["Tables"]["profiles"]["Row"]): Partial<AppSettings> {
  return {
    unitSystem: r.unit_system,
    sex: r.sex,
    bodyweightKg: r.bodyweight_kg,
    defaultRestSeconds: r.default_rest_seconds,
    barWeightKg: r.bar_weight_kg,
    availablePlatesKg: r.available_plates_kg,
    streak: r.streak,
    lastWorkoutDate: r.last_workout_date ?? undefined,
    activeProgramId: r.active_program_id ?? undefined,
    activeProgramDayIndex: r.active_program_day_index ?? undefined,
    updatedAt: ms(r.updated_at),
  };
}
