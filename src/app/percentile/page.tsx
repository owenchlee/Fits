"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Info } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/db";
import { useSettings } from "@/lib/db/hooks";
import { updateSettings } from "@/lib/db/repo";
import { estimateOneRepMax } from "@/lib/calc/one-rep-max";
import { fromDisplayWeight, toDisplayWeight } from "@/lib/calc/units";
import { sanitizeDecimalInput } from "@/lib/format";
import {
  calculateDotsScore,
  calculateExercisePercentile,
  calculateLiftPercentile,
  dotsToPercentile,
  percentileToTier,
  LIFT_LABELS,
  type ExercisePercentileResult,
  type StandardLift,
} from "@/lib/calc/strength-standards";
import type { Sex } from "@/lib/db/types";
import { PageHeader } from "@/components/shared/page-header";
import { PercentileGauge } from "@/components/percentile/percentile-gauge";
import { LiftPercentileRow } from "@/components/percentile/lift-percentile-row";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const LIFTS: StandardLift[] = ["squat", "bench", "deadlift", "overhead-press"];

function useBestLiftsKg() {
  return useLiveQuery(async () => {
    const exercises = await db.exercises.filter((e) => e.standardLift !== null).toArray();
    const results: Partial<Record<StandardLift, number>> = {};
    for (const ex of exercises) {
      const sets = await db.sets.where("exerciseId").equals(ex.id).toArray();
      const best = sets.reduce((max, s) => Math.max(max, estimateOneRepMax(s.weightKg, s.reps)), 0);
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
      const bestKg = sets.reduce((max, s) => Math.max(max, estimateOneRepMax(s.weightKg, s.reps)), 0);
      if (bestKg <= 0) continue;
      const result = calculateExercisePercentile(ex, bestKg, bodyweightKg, sex);
      if (result) results.push(result);
    }
    return results.sort((a, b) => b.percentile - a.percentile);
  }, [sex, bodyweightKg]);
}

export default function PercentilePage() {
  const settings = useSettings();
  const bestLifts = useBestLiftsKg();

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
  const dots = hasTotal ? calculateDotsScore(totalKg, bodyweightKg, sex) : 0;
  const overallPercentile = hasTotal ? dotsToPercentile(dots) : 0;
  const overallTier = percentileToTier(overallPercentile);

  const allRatedLifts = useAllRatedLifts(sex, bodyweightKg);

  return (
    <div className="pb-6">
      <PageHeader
        eyebrow="How strong are you, really"
        title="Strength Percentile"
        description="See how your lifts stack up against the general lifting population, adjusted for bodyweight and sex."
      />

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
              and the DOTS formula) — not a scientific census. Lifts marked &quot;est.&quot; are extrapolated from a
              typical ratio to the nearest main lift rather than their own standards table (tap the (est.) icon on a
              lift to see the ratio used). Use them as a rough compass, not gospel.
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
            <Info size={14} className="mt-0.5 shrink-0" />
            <p>
              <strong className="font-medium text-foreground">How the weight you log is read:</strong> every set
              uses the number you type as-is — there&apos;s no automatic doubling or bodyweight math. For dumbbell
              exercises, enter the combined weight of both dumbbells (e.g. 60 for a pair of 30s), not one dumbbell.
              For bodyweight exercises, enter only the added weight (belt, vest, plate) — leave it at 0 for
              unweighted sets, though unweighted sets won&apos;t produce an e1RM or percentile since there&apos;s no
              population data for bodyweight-relative reps.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-tl-md rounded-tr-[2.5rem] rounded-br-md rounded-bl-[2.5rem] border border-border bg-card p-6">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Overall (Squat + Bench + Deadlift total, DOTS-adjusted)
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
                  percentile (e.g. Dumbbell Bench Press, Goblet Squat, Romanian Deadlift, Hip Thrust) — log some
                  working sets for one of those and it&apos;ll show up here. Isolation and bodyweight exercises
                  (curls, laterals, push-ups, pull-ups, planks) aren&apos;t scored — there&apos;s no reliable
                  population data to compare them against.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
