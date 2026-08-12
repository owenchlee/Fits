"use client";

import { formatWeight } from "@/lib/calc/units";
import { LIFT_LABELS, type ExercisePercentileResult, type LiftPercentileResult } from "@/lib/calc/strength-standards";
import { ordinalSuffix } from "@/lib/format";
import type { UnitSystem } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const TIER_COLORS: Record<string, string> = {
  Beginner: "bg-muted-foreground/40",
  Novice: "bg-chart-3",
  Intermediate: "bg-chart-2",
  Advanced: "bg-primary",
  Elite: "bg-highlight",
};

export function LiftPercentileRow({
  result,
  unit,
}: {
  result: LiftPercentileResult | ExercisePercentileResult;
  unit: UnitSystem;
}) {
  const hasValue = result.multiplier > 0;
  const roundedPercentile = Math.round(result.percentile);
  const label = "exerciseName" in result ? result.exerciseName : LIFT_LABELS[result.lift];
  const isEstimated = "isEstimated" in result && result.isEstimated;

  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">
          {label}
          {isEstimated && <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">(est.)</span>}
        </p>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold text-primary-foreground",
            hasValue ? TIER_COLORS[result.tier] : "bg-secondary text-muted-foreground"
          )}
        >
          {hasValue ? result.tier : "—"}
        </span>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: hasValue ? `${Math.min(100, Math.max(2, result.percentile))}%` : "0%" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {hasValue
            ? `${result.multiplier.toFixed(2)}× bodyweight · ${roundedPercentile}${ordinalSuffix(roundedPercentile)} percentile`
            : "Enter a 1RM to see this lift"}
        </span>
        {hasValue && result.nextTierMultiplier && result.nextTier && (
          <span className="tabular-nums">
            {formatWeight(result.nextTierMultiplier, unit, { decimals: 0 })} for {result.nextTier}
          </span>
        )}
      </div>
    </div>
  );
}
