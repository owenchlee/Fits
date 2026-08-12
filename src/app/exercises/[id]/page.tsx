"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/db";
import { useSettings } from "@/lib/db/hooks";
import { estimateOneRepMax } from "@/lib/calc/one-rep-max";
import { formatWeight, toDisplayWeight } from "@/lib/calc/units";
import { calculateExercisePercentile } from "@/lib/calc/strength-standards";
import { StatCard } from "@/components/shared/stat-card";
import { TrendChart, type TrendPoint } from "@/components/charts/trend-chart";
import { LiftPercentileRow } from "@/components/percentile/lift-percentile-row";
import { Trophy, Barbell, ChartLineUp } from "@phosphor-icons/react/dist/ssr";

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const settings = useSettings();
  const exercise = useLiveQuery(() => db.exercises.get(params.id), [params.id]);
  const sets = useLiveQuery(
    () => db.sets.where("exerciseId").equals(params.id).sortBy("completedAt"),
    [params.id]
  );

  if (!exercise) return <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>;

  const workingSets = (sets ?? []).filter((s) => !s.isWarmup);
  const bestE1rm = workingSets.reduce((max, s) => Math.max(max, estimateOneRepMax(s.weightKg, s.reps)), 0);
  const totalSets = workingSets.length;

  const byWorkout = new Map<string, { date: number; best: number }>();
  for (const s of workingSets) {
    const e1rm = estimateOneRepMax(s.weightKg, s.reps);
    const existing = byWorkout.get(s.workoutId);
    if (!existing || e1rm > existing.best) byWorkout.set(s.workoutId, { date: s.completedAt, best: e1rm });
  }
  const chartData: TrendPoint[] = Array.from(byWorkout.values())
    .sort((a, b) => a.date - b.date)
    .map((point) => ({
      date: new Date(point.date).toISOString(),
      value: Math.round(toDisplayWeight(point.best, settings.unitSystem)),
      label: new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    }));

  const recentSets = [...workingSets].reverse().slice(0, 15);

  const percentileResult =
    bestE1rm > 0
      ? calculateExercisePercentile(exercise, bestE1rm, settings.bodyweightKg, settings.sex)
      : null;

  return (
    <div className="pb-6">
      <Link href="/exercises" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <CaretLeft size={14} /> Exercise Library
      </Link>

      <h1 className="font-display text-3xl font-bold tracking-tight">{exercise.name}</h1>
      <p className="mt-1 text-sm capitalize text-muted-foreground">
        {exercise.primaryMuscle} · {exercise.equipment}
        {exercise.secondaryMuscles.length > 0 && ` · also ${exercise.secondaryMuscles.join(", ")}`}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Best est. 1RM" value={bestE1rm ? formatWeight(bestE1rm, settings.unitSystem, { decimals: 0 }).split(" ")[0] : "—"} unit={settings.unitSystem} icon={Trophy} accent />
        <StatCard label="Sessions logged" value={String(byWorkout.size)} icon={ChartLineUp} />
        <StatCard label="Total sets" value={String(totalSets)} icon={Barbell} />
      </div>

      {bestE1rm > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-lg font-bold">Strength percentile</h2>
          {percentileResult ? (
            <LiftPercentileRow result={percentileResult} unit={settings.unitSystem} />
          ) : (
            <p className="rounded-xl border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground">
              No population standards for this exercise yet — percentiles are only available for lifts related to
              the squat, bench, deadlift, or overhead press.
            </p>
          )}
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 font-display text-lg font-bold">Estimated 1RM trend</h2>
        <TrendChart data={chartData} unitLabel={settings.unitSystem} />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-display text-lg font-bold">Recent sets</h2>
        {recentSets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sets logged yet.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2 text-right font-medium">Weight</th>
                  <th className="px-3 py-2 text-right font-medium">Reps</th>
                  <th className="px-3 py-2 text-right font-medium">RPE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentSets.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(s.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatWeight(s.weightKg, settings.unitSystem)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.reps}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{s.rpe ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
