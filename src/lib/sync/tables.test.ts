import { test } from "node:test";
import assert from "node:assert/strict";
import type { Database } from "@/lib/supabase/types";
import type { AppSettings, BodyMetric, Exercise, PercentileSnapshot, Program, SetEntry, Workout } from "@/lib/db/types";
import {
  REMOTE_TABLE,
  SYNC_TABLES,
  bodyMetricToRow,
  exerciseToRow,
  percentileSnapshotToRow,
  profileRowToSettings,
  programToRow,
  rowToBodyMetric,
  rowToExercise,
  rowToPercentileSnapshot,
  rowToProgram,
  rowToSet,
  rowToWorkout,
  setToRow,
  settingsToProfileRow,
  shouldSyncExercise,
  shouldSyncProgram,
  workoutToRow,
} from "@/lib/sync/tables";

type Tables = Database["public"]["Tables"];
// What Supabase hands back for a row we just inserted.
const asRow = <T extends keyof Tables>(insert: Tables[T]["Insert"]) =>
  ({ deleted_at: null, ...insert }) as Tables[T]["Row"];

const USER = "user-1";
const T1 = Date.UTC(2026, 10, 2, 9, 30, 0);
const T2 = Date.UTC(2026, 10, 2, 10, 45, 15, 250);

test("SYNC_TABLES all map to a remote table", () => {
  assert.deepEqual(SYNC_TABLES, ["exercises", "programs", "workouts", "sets", "bodyMetrics", "percentileSnapshots"]);
  assert.equal(REMOTE_TABLE.bodyMetrics, "body_metrics");
  assert.equal(REMOTE_TABLE.percentileSnapshots, "percentile_snapshots");
  for (const t of SYNC_TABLES) assert.ok(REMOTE_TABLE[t]);
});

const fullExercise: Exercise = {
  id: "ex-1",
  name: "Paused Bench",
  primaryMuscle: "chest",
  secondaryMuscles: ["triceps", "shoulders"],
  equipment: "barbell",
  isUnilateral: true,
  isCustom: true,
  standardLift: null,
  standardLiftRatio: { basedOn: "bench", ratio: 0.9 },
  notes: "2s pause",
  updatedAt: T1,
};

test("exerciseToRow maps fields to snake_case and ISO timestamps", () => {
  const row = exerciseToRow(fullExercise, USER);
  assert.equal(row.user_id, USER);
  assert.equal(row.primary_muscle, "chest");
  assert.deepEqual(row.secondary_muscles, ["triceps", "shoulders"]);
  assert.equal(row.is_unilateral, true);
  assert.deepEqual(row.standard_lift_ratio, { basedOn: "bench", ratio: 0.9 });
  assert.equal(row.updated_at, "2026-11-02T09:30:00.000Z");
});

test("exercise round-trips, including omitted optionals", () => {
  assert.deepEqual(rowToExercise(asRow<"exercises">(exerciseToRow(fullExercise, USER))), fullExercise);

  const minimal: Exercise = {
    id: "ex-2",
    name: "Squat",
    primaryMuscle: "quads",
    secondaryMuscles: [],
    equipment: "barbell",
    isCustom: false,
    standardLift: "squat",
    updatedAt: T2,
  };
  const row = exerciseToRow(minimal, USER);
  assert.equal(row.is_unilateral, null);
  assert.equal(row.standard_lift_ratio, null);
  assert.equal(row.notes, null);
  const back = rowToExercise(asRow<"exercises">(row));
  assert.deepEqual(back, { ...minimal, isUnilateral: undefined, standardLiftRatio: undefined, notes: undefined });
});

test("shouldSyncExercise / shouldSyncProgram only sync custom items", () => {
  assert.equal(shouldSyncExercise(fullExercise), true);
  assert.equal(shouldSyncExercise({ ...fullExercise, isCustom: false }), false);
  assert.equal(shouldSyncProgram(fullProgram), true);
  assert.equal(shouldSyncProgram({ ...fullProgram, isCustom: false }), false);
});

const fullProgram: Program = {
  id: "prog-1",
  name: "PPL",
  description: "Push pull legs",
  author: "me",
  daysPerWeek: 3,
  isCustom: true,
  days: [{ id: "d1", name: "Push", exercises: [{ exerciseId: "ex-1", targetSets: 3, targetReps: "8-12" }] }],
  schedule: [0, null, 0, null],
  cycleStartDate: "2026-11-02",
  updatedAt: T1,
};

test("program round-trips and null schedule becomes undefined", () => {
  const row = programToRow(fullProgram, USER);
  assert.equal(row.days_per_week, 3);
  assert.equal(row.cycle_start_date, "2026-11-02");
  assert.deepEqual(rowToProgram(asRow<"programs">(row)), fullProgram);

  const noSchedule: Program = { ...fullProgram, schedule: undefined, cycleStartDate: undefined };
  const row2 = programToRow(noSchedule, USER);
  assert.equal(row2.schedule, null);
  assert.equal(row2.cycle_start_date, null);
  assert.deepEqual(rowToProgram(asRow<"programs">(row2)), noSchedule);
});

test("workout round-trips; in-progress workout has null completed_at", () => {
  const done: Workout = {
    id: "w-1",
    programId: "prog-1",
    programDayName: "Push",
    title: "Push day",
    startedAt: T1,
    completedAt: T2,
    notes: "good",
    bodyweightKg: 80.5,
    exerciseOrder: ["ex-1", "ex-2"],
    updatedAt: T2,
  };
  const row = workoutToRow(done, USER);
  assert.equal(row.started_at, "2026-11-02T09:30:00.000Z");
  assert.equal(row.completed_at, "2026-11-02T10:45:15.250Z");
  assert.deepEqual(rowToWorkout(asRow<"workouts">(row)), done);

  const live: Workout = { id: "w-2", title: "Quick", startedAt: T1, exerciseOrder: [], updatedAt: T1 };
  const liveRow = workoutToRow(live, USER);
  assert.equal(liveRow.completed_at, null);
  assert.equal(liveRow.program_id, null);
  assert.equal(liveRow.bodyweight_kg, null);
  assert.deepEqual(rowToWorkout(asRow<"workouts">(liveRow)), {
    ...live,
    programId: undefined,
    programDayName: undefined,
    completedAt: undefined,
    notes: undefined,
    bodyweightKg: undefined,
  });
});

test("set round-trips, including zero weight and missing rpe", () => {
  const s: SetEntry = {
    id: "s-1",
    workoutId: "w-1",
    exerciseId: "ex-1",
    setIndex: 0,
    weightKg: 102.5,
    reps: 5,
    rpe: 8.5,
    isWarmup: false,
    isFailure: true,
    isDropSet: false,
    completedAt: T1,
    updatedAt: T2,
  };
  const row = setToRow(s, USER);
  assert.equal(row.set_index, 0);
  assert.equal(row.weight_kg, 102.5);
  assert.equal(row.is_failure, true);
  assert.deepEqual(rowToSet(asRow<"sets">(row)), s);

  const bodyweight: SetEntry = { ...s, id: "s-2", weightKg: 0, rpe: undefined, isWarmup: true };
  const row2 = setToRow(bodyweight, USER);
  assert.equal(row2.weight_kg, 0);
  assert.equal(row2.rpe, null);
  assert.deepEqual(rowToSet(asRow<"sets">(row2)), bodyweight);
});

test("body metric stores a yyyy-mm-dd date and round-trips at UTC midnight", () => {
  const b: BodyMetric = {
    id: "b-1",
    date: Date.UTC(2026, 10, 2),
    weightKg: 81.2,
    bodyFatPct: 15,
    measurements: { waist: 82, arm: 38 },
    updatedAt: T1,
  };
  const row = bodyMetricToRow(b, USER);
  assert.equal(row.date, "2026-11-02");
  assert.deepEqual(rowToBodyMetric(asRow<"body_metrics">(row)), b);

  const bare: BodyMetric = { id: "b-2", date: Date.UTC(2026, 0, 1), updatedAt: T1 };
  const row2 = bodyMetricToRow(bare, USER);
  assert.equal(row2.weight_kg, null);
  assert.equal(row2.measurements, null);
  assert.deepEqual(rowToBodyMetric(asRow<"body_metrics">(row2)), {
    ...bare,
    weightKg: undefined,
    bodyFatPct: undefined,
    measurements: undefined,
  });
});

test("percentile snapshot round-trips, including null overall", () => {
  const p: PercentileSnapshot = {
    id: "p-1",
    date: "2026-11-02",
    overallPercentile: 63.5,
    perLift: { "ex-1": 70, "ex-2": 57 },
    updatedAt: T1,
  };
  const row = percentileSnapshotToRow(p, USER);
  assert.equal(row.overall_percentile, 63.5);
  assert.deepEqual(rowToPercentileSnapshot(asRow<"percentile_snapshots">(row)), p);

  const empty: PercentileSnapshot = { ...p, overallPercentile: null, perLift: {} };
  assert.deepEqual(rowToPercentileSnapshot(asRow<"percentile_snapshots">(percentileSnapshotToRow(empty, USER))), empty);
});

test("settings <-> profile row round-trips the synced fields", () => {
  const s: AppSettings = {
    id: "singleton",
    unitSystem: "lb",
    sex: "female",
    bodyweightKg: 62,
    defaultRestSeconds: 120,
    barWeightKg: 15,
    availablePlatesKg: [20, 10, 5, 2.5, 1.25],
    streak: 4,
    lastWorkoutDate: "2026-11-01",
    activeProgramId: "prog-1",
    activeProgramDayIndex: 0,
    hiddenProgramIds: ["builtin-1"],
    updatedAt: T1,
  };
  const row = settingsToProfileRow(s, USER);
  assert.equal(row.id, USER);
  assert.equal(row.active_program_day_index, 0);
  assert.equal("hidden_program_ids" in row, false);

  const { id: _id, hiddenProgramIds: _hidden, ...synced } = s;
  void _id;
  void _hidden;
  assert.deepEqual(profileRowToSettings(row as Tables["profiles"]["Row"]), synced);

  const fresh: AppSettings = { ...s, streak: 0, lastWorkoutDate: undefined, activeProgramId: undefined, activeProgramDayIndex: undefined };
  const freshRow = settingsToProfileRow(fresh, USER);
  assert.equal(freshRow.last_workout_date, null);
  assert.equal(freshRow.active_program_id, null);
  assert.equal(freshRow.active_program_day_index, null);
  const back = profileRowToSettings(freshRow as Tables["profiles"]["Row"]);
  assert.equal(back.lastWorkoutDate, undefined);
  assert.equal(back.activeProgramId, undefined);
  assert.equal(back.activeProgramDayIndex, undefined);
  assert.equal(back.streak, 0);
});

test("missing updated_at falls back to now", () => {
  const row = asRow<"percentile_snapshots">(percentileSnapshotToRow({ id: "p", date: "2026-11-02", overallPercentile: null, perLift: {}, updatedAt: T1 }, USER));
  const before = Date.now();
  const back = rowToPercentileSnapshot({ ...row, updated_at: "" });
  assert.ok(back.updatedAt >= before && back.updatedAt <= Date.now());
});
