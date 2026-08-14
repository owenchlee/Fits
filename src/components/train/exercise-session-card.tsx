"use client";

import * as React from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, TrendUp, X } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/db";
import { addSet, deleteSet, getLastPerformance, updateSet, removeExerciseFromWorkout } from "@/lib/db/repo";
import { useRestTimer } from "@/lib/timer/rest-timer-context";
import { estimateOneRepMax } from "@/lib/calc/one-rep-max";
import { calculateWarmupSet } from "@/lib/calc/warmup";
import { formatWeight } from "@/lib/calc/units";
import type { SetEntry, UnitSystem } from "@/lib/db/types";
import { SetRow } from "@/components/train/set-row";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

/** Warm-up sets always render first regardless of insertion order, so toggling the warm-up
 * on/off after working sets already exist doesn't reshuffle their numbering. */
function orderSets(sets: SetEntry[]): SetEntry[] {
  return [...sets].sort((a, b) => {
    if (a.isWarmup !== b.isWarmup) return a.isWarmup ? -1 : 1;
    return a.completedAt - b.completedAt;
  });
}

export function ExerciseSessionCard({
  workoutId,
  exerciseId,
  targetSets,
  targetReps,
  restSeconds,
  unit,
  sets,
}: {
  workoutId: string;
  exerciseId: string;
  targetSets?: number;
  targetReps?: string;
  restSeconds: number;
  unit: UnitSystem;
  sets: SetEntry[];
}) {
  const exercise = useLiveQuery(() => db.exercises.get(exerciseId), [exerciseId]);
  const previousSets = useLiveQuery(() => getLastPerformance(exerciseId, workoutId), [exerciseId, workoutId]);
  const timer = useRestTimer();

  const orderedSets = React.useMemo(() => orderSets(sets), [sets]);
  const bestThisSession = sets.reduce((max, s) => Math.max(max, estimateOneRepMax(s.weightKg, s.reps)), 0);
  const recommendedWarmup = previousSets ? calculateWarmupSet(previousSets, unit) : null;
  const hasWarmupSet = sets.some((s) => s.isWarmup);

  async function initializeSets() {
    const warmup = previousSets ? calculateWarmupSet(previousSets, unit) : null;
    if (warmup) {
      await addSet({ workoutId, exerciseId, weightKg: warmup.weightKg, reps: warmup.reps, isWarmup: true });
    }
    for (let i = 0; i < (targetSets ?? 0); i++) {
      await addSet({ workoutId, exerciseId, weightKg: 0, reps: 0 });
    }
  }

  const hasInitializedRef = React.useRef(false);
  React.useEffect(() => {
    if (hasInitializedRef.current) return;
    if (sets.length > 0) {
      hasInitializedRef.current = true;
      return;
    }
    if (previousSets === undefined) return;
    hasInitializedRef.current = true;
    void initializeSets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sets.length, previousSets, workoutId, exerciseId, targetSets]);

  async function toggleWarmup(enabled: boolean) {
    if (enabled) {
      if (!recommendedWarmup) return;
      await addSet({ workoutId, exerciseId, weightKg: recommendedWarmup.weightKg, reps: recommendedWarmup.reps, isWarmup: true });
    } else {
      const existing = sets.find((s) => s.isWarmup);
      if (existing) await deleteSet(existing.id);
    }
  }

  async function handleAddSet() {
    const workingSets = sets.filter((s) => !s.isWarmup);
    const last = workingSets[workingSets.length - 1];
    const prev = previousSets?.filter((s) => !s.isWarmup)[workingSets.length];
    const weightKg = last?.weightKg ?? prev?.weightKg ?? 0;
    const reps = last?.reps ?? prev?.reps ?? 0;
    await addSet({ workoutId, exerciseId, weightKg, reps });
  }

  function handleSetChange(setId: string, patch: Partial<SetEntry>, isNewlyCompleted: boolean) {
    void updateSet(setId, patch);
    if (isNewlyCompleted) {
      timer.start(restSeconds, exercise?.name);
    }
  }

  const workingSets = orderedSets.filter((s) => !s.isWarmup);

  const weightColumnLabel = exercise?.equipment === "bodyweight" ? "Added" : "Weight";

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div>
          <Link href={`/exercises/${exerciseId}`} className="font-display text-lg font-bold hover:text-primary">
            {exercise?.name ?? "…"}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {targetSets && (
              <span>
                Target {targetSets}
                {targetReps ? ` × ${targetReps}` : " sets"}
              </span>
            )}
            {bestThisSession > 0 && (
              <span className="flex items-center gap-1 text-primary">
                <TrendUp size={12} weight="bold" /> {formatWeight(bestThisSession, unit, { decimals: 0 })} e1RM
              </span>
            )}
          </div>
        </div>
        <button
          aria-label={`Remove ${exercise?.name ?? "exercise"} from workout`}
          onClick={() => removeExerciseFromWorkout(workoutId, exerciseId)}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"
        >
          <X size={14} />
        </button>
      </div>

      {recommendedWarmup && (
        <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Switch size="sm" checked={hasWarmupSet} onCheckedChange={toggleWarmup} />
          Warm-up set
        </label>
      )}

      {orderedSets.length > 0 && (
        <div className="mb-1 flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="w-5 shrink-0" />
          <span className="w-16 shrink-0 text-center">{weightColumnLabel}</span>
          <span className="w-3 shrink-0" />
          <span className="w-12 shrink-0 text-center">Reps</span>
        </div>
      )}

      <div className="space-y-1">
        {orderedSets.map((s, i) => {
          return (
            <SetRow
              key={s.id}
              index={s.isWarmup ? 0 : workingSets.indexOf(s) + 1}
              unit={unit}
              set={s}
              previous={previousSets?.[i]}
              onChange={(patch) => {
                const willBeComplete = (patch.weightKg ?? s.weightKg) > 0 && (patch.reps ?? s.reps) > 0;
                const wasComplete = s.weightKg > 0 && s.reps > 0;
                handleSetChange(s.id, patch, willBeComplete && !wasComplete && !s.isWarmup);
              }}
              onDelete={() => deleteSet(s.id)}
            />
          );
        })}
      </div>

      <Button variant="ghost" size="sm" className="mt-2 w-full justify-center text-muted-foreground" onClick={handleAddSet}>
        <Plus size={15} /> Add set
      </Button>
    </div>
  );
}
