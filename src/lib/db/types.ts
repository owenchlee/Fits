export type Sex = "male" | "female";
export type UnitSystem = "kg" | "lb";

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core"
  | "forearms"
  | "traps"
  | "full-body";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "kettlebell"
  | "bands"
  | "other";

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  isCustom: boolean;
  /** Used to key against strength-standard tables (squat/bench/deadlift/ohp), null if not tracked. */
  standardLift: "squat" | "bench" | "deadlift" | "overhead-press" | null;
  notes?: string;
}

export interface ProgramExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: string; // e.g. "5", "8-12", "AMRAP"
  targetRpe?: number;
  percentOfMax?: number; // for %-based programs like 5/3/1
  restSeconds: number;
}

export interface ProgramDay {
  id: string;
  name: string; // e.g. "Day A", "Push"
  exercises: ProgramExercise[];
}

export interface Program {
  id: string;
  name: string;
  description: string;
  author: string;
  daysPerWeek: number;
  isCustom: boolean;
  days: ProgramDay[];
}

export interface SetEntry {
  id: string;
  workoutId: string;
  exerciseId: string;
  setIndex: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  isWarmup: boolean;
  isFailure: boolean;
  isDropSet: boolean;
  completedAt: number;
}

export interface Workout {
  id: string;
  programId?: string;
  programDayName?: string;
  title: string;
  startedAt: number;
  completedAt?: number;
  notes?: string;
  bodyweightKg?: number;
  exerciseOrder: string[];
}

export interface BodyMetric {
  id: string;
  date: number;
  weightKg?: number;
  bodyFatPct?: number;
  measurements?: Partial<
    Record<"chest" | "waist" | "hips" | "thigh" | "arm" | "calf" | "shoulders", number>
  >;
}

export interface AppSettings {
  id: "singleton";
  unitSystem: UnitSystem;
  sex: Sex;
  bodyweightKg: number;
  defaultRestSeconds: number;
  barWeightKg: number;
  availablePlatesKg: number[];
  streak: number;
  lastWorkoutDate?: string; // yyyy-mm-dd
  activeProgramId?: string;
  activeProgramDayIndex?: number;
}
