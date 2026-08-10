import Dexie, { type EntityTable } from "dexie";
import type { AppSettings, BodyMetric, Exercise, Program, SetEntry, Workout } from "./types";

class FitsDatabase extends Dexie {
  exercises!: EntityTable<Exercise, "id">;
  programs!: EntityTable<Program, "id">;
  workouts!: EntityTable<Workout, "id">;
  sets!: EntityTable<SetEntry, "id">;
  bodyMetrics!: EntityTable<BodyMetric, "id">;
  settings!: EntityTable<AppSettings, "id">;

  constructor() {
    super("fits-db");
    this.version(1).stores({
      exercises: "id, name, primaryMuscle, equipment, standardLift",
      programs: "id, name",
      workouts: "id, startedAt, completedAt, programId",
      sets: "id, workoutId, exerciseId, completedAt",
      bodyMetrics: "id, date",
      settings: "id",
    });
  }
}

export const db = new FitsDatabase();
