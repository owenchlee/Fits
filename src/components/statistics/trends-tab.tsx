"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import { useExercises, usePercentileHistory, useSettings } from "@/lib/db/hooks";
import { getCompletedSets } from "@/lib/db/repo";
import { estimateOneRepMax } from "@/lib/calc/one-rep-max";
import { toTotalLoadKg } from "@/lib/calc/load";
import { toDisplayWeight } from "@/lib/calc/units";
import { TrendChart, type TrendPoint } from "@/components/charts/trend-chart";
import { VolumeBarChart, type VolumePoint } from "@/components/charts/volume-bar-chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function startOfWeek(ms: number) {
  const d = new Date(ms);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d.getTime();
}

function useWeeklyVolumeSeries(weeks: number) {
  const settings = useSettings();
  return useLiveQuery(async () => {
    const now = Date.now();
    const earliest = now - weeks * 7 * 86400000;
    const completedSets = await getCompletedSets();
    const sets = completedSets.filter((s) => s.completedAt >= earliest && !s.isWarmup);
    const exercises = await db.exercises.bulkGet(Array.from(new Set(sets.map((s) => s.exerciseId))));
    const exerciseById = new Map(exercises.filter((e) => !!e).map((e) => [e!.id, e!]));
    const buckets = new Map<number, number>();
    for (const s of sets) {
      const wk = startOfWeek(s.completedAt);
      const loadKg = toTotalLoadKg(s.weightKg, exerciseById.get(s.exerciseId)) * s.reps;
      buckets.set(wk, (buckets.get(wk) ?? 0) + loadKg);
    }
    const points: VolumePoint[] = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const wk = startOfWeek(now - i * 7 * 86400000);
      const kg = buckets.get(wk) ?? 0;
      points.push({
        label: new Date(wk).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        value: Math.round(toDisplayWeight(kg, settings.unitSystem)),
      });
    }
    return points;
  }, [weeks, settings.unitSystem]);
}

function useExerciseTrend(exerciseId: string | undefined) {
  const settings = useSettings();
  return useLiveQuery(async () => {
    if (!exerciseId) return [];
    // Kept in the weight actually entered (per dumbbell, if applicable) — this chart is about
    // this one exercise's own progression, not a cross-exercise/strength-standard comparison.
    const sets = await db.sets.where("exerciseId").equals(exerciseId).filter((s) => !s.isWarmup).sortBy("completedAt");
    const byWorkout = new Map<string, { date: number; best: number }>();
    for (const s of sets) {
      const e1rm = estimateOneRepMax(s.weightKg, s.reps);
      const existing = byWorkout.get(s.workoutId);
      if (!existing || e1rm > existing.best) byWorkout.set(s.workoutId, { date: s.completedAt, best: e1rm });
    }
    return Array.from(byWorkout.values())
      .sort((a, b) => a.date - b.date)
      .map<TrendPoint>((point) => ({
        date: new Date(point.date).toISOString(),
        value: Math.round(toDisplayWeight(point.best, settings.unitSystem)),
        label: new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      }));
  }, [exerciseId, settings.unitSystem]);
}

function usePercentileTrend() {
  const snapshots = usePercentileHistory();
  return React.useMemo<TrendPoint[]>(
    () =>
      snapshots
        .filter((s) => s.overallPercentile !== null)
        .map((s) => ({
          date: s.date,
          value: Math.round((s.overallPercentile ?? 0) * 10) / 10,
          label: new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        })),
    [snapshots]
  );
}

export function TrendsTab() {
  const settings = useSettings();
  const exercises = useExercises();
  const [selectedExerciseId, setExerciseId] = React.useState<string | undefined>(undefined);
  const defaultExerciseId = exercises.find((e) => e.standardLift === "squat")?.id ?? exercises[0]?.id;
  const exerciseId = selectedExerciseId ?? defaultExerciseId;

  const weeklyVolume = useWeeklyVolumeSeries(10);
  const liftTrend = useExerciseTrend(exerciseId);
  const percentileTrend = usePercentileTrend();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold">Lift progress</h2>
          <Select value={exerciseId} onValueChange={setExerciseId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Choose exercise" />
            </SelectTrigger>
            <SelectContent>
              {exercises.map((ex) => (
                <SelectItem key={ex.id} value={ex.id}>
                  {ex.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <TrendChart data={liftTrend ?? []} unitLabel={`${settings.unitSystem} e1RM`} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 font-display text-lg font-bold">Strength percentile over time</h2>
        <TrendChart
          data={percentileTrend}
          unitLabel="percentile"
          emptyLabel="No percentile history yet"
        />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 font-display text-lg font-bold">Weekly training volume</h2>
        <VolumeBarChart data={weeklyVolume ?? []} unitLabel={settings.unitSystem} />
      </section>
    </div>
  );
}
