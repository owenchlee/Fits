"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { Download, Info } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/db";
import { useSettings } from "@/lib/db/hooks";
import { updateSettings, exportAllData, getCompletedSets, getCompletedWorkouts } from "@/lib/db/repo";
import { estimateOneRepMax } from "@/lib/calc/one-rep-max";
import { toTotalLoadKg } from "@/lib/calc/load";
import { fromDisplayWeight, toDisplayWeight, formatWeight } from "@/lib/calc/units";
import { sanitizeDecimalInput } from "@/lib/format";
import {
  calculateExercisePercentile,
  calculateLiftPercentile,
  totalToPercentile,
  percentileToTier,
  LIFT_LABELS,
  type ExercisePercentileResult,
  type StandardLift,
} from "@/lib/calc/strength-standards";
import type { Sex } from "@/lib/db/types";
import { PercentileGauge } from "@/components/percentile/percentile-gauge";
import { LiftPercentileRow } from "@/components/percentile/lift-percentile-row";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LIFTS: StandardLift[] = ["squat", "bench", "deadlift", "overhead-press"];

function useBestLiftsKg() {
  return useLiveQuery(async () => {
    const exercises = await db.exercises.filter((e) => e.standardLift !== null).toArray();
    const results: Partial<Record<StandardLift, number>> = {};
    for (const ex of exercises) {
      const sets = await db.sets.where("exerciseId").equals(ex.id).toArray();
      const best = sets.reduce((max, s) => Math.max(max, estimateOneRepMax(toTotalLoadKg(s.weightKg, ex), s.reps)), 0);
      const lift = ex.standardLift as StandardLift;
      results[lift] = Math.max(results[lift] ?? 0, best);
    }
    return results;
  }, []);
}

function useAllRatedLifts(sex: Sex, bodyweightKg: number) {
  return useLiveQuery(async () => {
    // Anchor lifts (squat/bench/deadlift/OHP) already have their own editable row above —
    // only list the ratio-estimated ones here to avoid showing two (possibly different) numbers
    // for the same lift.
    const exercises = await db.exercises.filter((e) => e.standardLift === null && !!e.standardLiftRatio).toArray();
    const results: ExercisePercentileResult[] = [];
    for (const ex of exercises) {
      const sets = await db.sets.where("exerciseId").equals(ex.id).toArray();
      if (sets.length === 0) continue;
      const bestKg = sets.reduce((max, s) => Math.max(max, estimateOneRepMax(toTotalLoadKg(s.weightKg, ex), s.reps)), 0);
      if (bestKg <= 0) continue;
      const result = calculateExercisePercentile(ex, bestKg, bodyweightKg, sex);
      if (result) results.push(result);
    }
    return results.sort((a, b) => b.percentile - a.percentile);
  }, [sex, bodyweightKg]);
}

function useOverallStats() {
  const settings = useSettings();
  return useLiveQuery(async () => {
    const [workouts, completedSets] = await Promise.all([getCompletedWorkouts(), getCompletedSets()]);
    const sets = completedSets.filter((s) => !s.isWarmup);
    const exercises = await db.exercises.bulkGet(Array.from(new Set(sets.map((s) => s.exerciseId))));
    const exerciseById = new Map(exercises.filter((e) => !!e).map((e) => [e!.id, e!]));
    const totalDurationMin = workouts.reduce(
      (sum, w) => sum + (w.completedAt ? Math.round((w.completedAt - w.startedAt) / 60000) : 0),
      0
    );
    const totalVolumeKg = sets.reduce(
      (sum, s) => sum + toTotalLoadKg(s.weightKg, exerciseById.get(s.exerciseId)) * s.reps,
      0
    );
    const totalReps = sets.reduce((sum, s) => sum + s.reps, 0);
    return {
      totalWorkouts: workouts.length,
      totalDurationMin,
      totalVolumeKg,
      totalSets: sets.length,
      totalReps,
      repsPerSet: sets.length > 0 ? totalReps / sets.length : 0,
      bodyweightKg: settings.bodyweightKg,
    };
  }, [settings.bodyweightKg]);
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function OverviewTab() {
  const settings = useSettings();
  const bestLifts = useBestLiftsKg();
  const overallStats = useOverallStats();

  const [sex, setSex] = React.useState<Sex>(settings.sex);
  const [bodyweightStr, setBodyweightStr] = React.useState("");
  const [liftInputs, setLiftInputs] = React.useState<Partial<Record<StandardLift, string>>>({});
  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (initialized.current || !bestLifts) return;
    initialized.current = true;
    setSex(settings.sex);
    setBodyweightStr(String(Math.round(toDisplayWeight(settings.bodyweightKg, settings.unitSystem))));
    const seeded: Partial<Record<StandardLift, string>> = {};
    for (const lift of LIFTS) {
      const kg = bestLifts[lift];
      if (kg) seeded[lift] = String(Math.round(toDisplayWeight(kg, settings.unitSystem)));
    }
    setLiftInputs(seeded);
  }, [bestLifts, settings]);

  const bodyweightKg = fromDisplayWeight(parseFloat(bodyweightStr) || 0, settings.unitSystem);

  const results = LIFTS.map((lift) => {
    const raw = parseFloat(liftInputs[lift] ?? "");
    const weightKg = Number.isFinite(raw) ? fromDisplayWeight(raw, settings.unitSystem) : 0;
    return calculateLiftPercentile(lift, weightKg, bodyweightKg, sex);
  });

  const bigThreeKg = ["squat", "bench", "deadlift"].map((lift) => {
    const raw = parseFloat(liftInputs[lift as StandardLift] ?? "");
    return Number.isFinite(raw) ? fromDisplayWeight(raw, settings.unitSystem) : 0;
  });
  const totalKg = bigThreeKg.reduce((sum, kg) => sum + kg, 0);
  const hasTotal = bigThreeKg.every((kg) => kg > 0) && bodyweightKg > 0;
  const overallPercentile = hasTotal ? totalToPercentile(totalKg, bodyweightKg, sex) : 0;
  const overallTier = percentileToTier(overallPercentile);

  const allRatedLifts = useAllRatedLifts(sex, bodyweightKg);

  function handleExport() {
    exportAllData().then((data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fits-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[19rem_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <Label className="mb-2 block text-xs font-medium text-muted-foreground">Sex</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["male", "female"] as Sex[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSex(s);
                    void updateSettings({ sex: s });
                  }}
                  className={cn(
                    "rounded-lg py-2 text-sm font-medium capitalize transition-colors",
                    sex === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <Label htmlFor="bodyweight" className="mb-1.5 mt-4 block text-xs font-medium text-muted-foreground">
              Bodyweight ({settings.unitSystem})
            </Label>
            <input
              id="bodyweight"
              inputMode="decimal"
              value={bodyweightStr}
              onChange={(e) => setBodyweightStr(sanitizeDecimalInput(e.target.value))}
              onBlur={() => {
                const n = parseFloat(bodyweightStr);
                if (Number.isFinite(n)) void updateSettings({ bodyweightKg: fromDisplayWeight(n, settings.unitSystem) });
              }}
              className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm tabular-nums focus:border-ring focus:outline-none"
            />

            <div className="mt-4 space-y-3">
              {LIFTS.map((lift) => (
                <div key={lift}>
                  <Label htmlFor={lift} className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {LIFT_LABELS[lift]} 1RM ({settings.unitSystem})
                  </Label>
                  <input
                    id={lift}
                    inputMode="decimal"
                    value={liftInputs[lift] ?? ""}
                    onChange={(e) =>
                      setLiftInputs((prev) => ({ ...prev, [lift]: sanitizeDecimalInput(e.target.value) }))
                    }
                    placeholder="0"
                    className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm tabular-nums focus:border-ring focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
            <Info size={14} className="mt-0.5 shrink-0" />
            <p>
              Estimates are based on aggregated community strength-standards data (bodyweight-relative multipliers
              and total-vs-bodyweight tables from strengthlevel.com), not a scientific census. Lifts marked
              &quot;est.&quot; are extrapolated from a
              typical ratio to the nearest main lift rather than their own standards table (tap the (est.) icon on a
              lift to see the ratio used). Use them as a rough compass, not gospel.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-tl-md rounded-tr-[2.5rem] rounded-br-md rounded-bl-[2.5rem] border border-border bg-card p-6">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Overall (Squat + Bench + Deadlift total, bodyweight-adjusted)
            </p>
            {hasTotal ? (
              <PercentileGauge percentile={overallPercentile} tier={overallTier} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Enter your squat, bench, and deadlift to see your overall percentile.
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {results.map((r) => (
              <LiftPercentileRow key={r.lift} result={r} unit={settings.unitSystem} />
            ))}
          </div>

          {allRatedLifts && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                All your lifts
              </p>
              {allRatedLifts.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {allRatedLifts.map((r) => (
                    <LiftPercentileRow key={r.exerciseId} result={r} unit={settings.unitSystem} />
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border p-3.5 text-xs text-muted-foreground">
                  Nothing here yet. Only exercises with a known ratio to squat/bench/deadlift/OHP get an estimated
                  percentile (e.g. Dumbbell Bench Press, Goblet Squat, Romanian Deadlift, Hip Thrust). Log some
                  working sets for one of those and it&apos;ll show up here. Isolation and bodyweight exercises
                  (curls, laterals, push-ups, pull-ups, planks) aren&apos;t scored: there&apos;s no reliable
                  population data to compare them against.
                </p>
              )}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Overall statistics
            </p>
            <div className="divide-y divide-border rounded-2xl border border-border bg-card">
              <StatRow label="Workout duration" value={overallStats ? formatDuration(overallStats.totalDurationMin) : "—"} />
              <StatRow
                label="Volume"
                value={overallStats ? formatWeight(overallStats.totalVolumeKg, settings.unitSystem, { decimals: 0 }) : "—"}
              />
              <StatRow label="Total sets" value={overallStats ? String(overallStats.totalSets) : "—"} />
              <StatRow label="Total reps" value={overallStats ? String(overallStats.totalReps) : "—"} />
              <StatRow label="Reps per set" value={overallStats ? overallStats.repsPerSet.toFixed(1) : "—"} />
              <StatRow
                label="Bodyweight"
                value={overallStats ? formatWeight(overallStats.bodyweightKg, settings.unitSystem, { decimals: 0 }) : "—"}
              />
              <StatRow label="Number of workouts" value={overallStats ? String(overallStats.totalWorkouts) : "—"} />
            </div>
            <Button variant="outline" onClick={handleExport} className="mt-3 w-full justify-center">
              <Download size={15} /> Export data (.json)
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p>
          <strong className="font-medium text-foreground">Logging dumbbell weight:</strong> enter one
          dumbbell&apos;s weight and we double it, unless the exercise is single-arm/leg. For weighted
          bodyweight moves, enter just the added weight.
        </p>
      </div>
    </div>
  );
}
