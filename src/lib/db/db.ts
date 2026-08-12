import Dexie, { type EntityTable } from "dexie";
import type {
  AppSettings,
  BodyMetric,
  Exercise,
  PercentileSnapshot,
  Program,
  SetEntry,
  Workout,
} from "./types";

/** One entry per pending local write, flushed to Supabase by the sync engine. */
export interface SyncOutboxEntry {
  id?: number;
  table: "exercises" | "programs" | "workouts" | "sets" | "bodyMetrics" | "settings" | "percentileSnapshots";
  recordId: string;
  op: "upsert" | "delete";
  createdAt: number;
}

class FitsDatabase extends Dexie {
  exercises!: EntityTable<Exercise, "id">;
  programs!: EntityTable<Program, "id">;
  workouts!: EntityTable<Workout, "id">;
  sets!: EntityTable<SetEntry, "id">;
  bodyMetrics!: EntityTable<BodyMetric, "id">;
  settings!: EntityTable<AppSettings, "id">;
  percentileSnapshots!: EntityTable<PercentileSnapshot, "id">;
  syncOutbox!: EntityTable<SyncOutboxEntry, "id">;

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

    this.version(2)
      .stores({
        exercises: "id, name, primaryMuscle, equipment, standardLift, updatedAt",
        programs: "id, name, updatedAt",
        workouts: "id, startedAt, completedAt, programId, updatedAt",
        sets: "id, workoutId, exerciseId, completedAt, updatedAt",
        bodyMetrics: "id, date, updatedAt",
        settings: "id, updatedAt",
        percentileSnapshots: "id, date, updatedAt",
        syncOutbox: "++id, table, recordId, createdAt",
      })
      .upgrade(async (tx) => {
        const now = Date.now();
        for (const tableName of ["exercises", "programs", "workouts", "sets", "bodyMetrics", "settings"] as const) {
          await tx
            .table(tableName)
            .toCollection()
            .modify((row: { updatedAt?: number }) => {
              row.updatedAt = row.updatedAt ?? now;
            });
        }
      });
  }
}

export const db = new FitsDatabase();
