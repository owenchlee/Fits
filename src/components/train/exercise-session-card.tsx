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
import { isSetComplete } from "@/lib/calc/set-status";
import { formatWeight } from "@/lib/calc/units";
import type { SetEntry, UnitSystem } from "@/lib/db/types";
import { SetRow } from "@/components/train/set-row";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  nextExerciseId,
  targetSets,
  targetReps,
  restSeconds,
  unit,
  sets,
}: {
  workoutId: string;
  exerciseId: string;
  nextExerciseId?: string;
  targetSets?: number;
  targetReps?: string;
  restSeconds: number;
  unit: UnitSystem;
  sets: SetEntry[];
}) {
  const exercise = useLiveQuery(() => db.exercises.get(exerciseId), [exerciseId]);
  const nextExercise = useLiveQuery(
    () => (nextExerciseId ? db.exercises.get(nextExerciseId) : undefined),
    [nextExerciseId]
  );
  const previousSets = useLiveQuery(() => getLastPerformance(exerciseId, workoutId), [exerciseId, workoutId]);
  const timer = useRestTimer();
  const [confirmRemove, setConfirmRemove] = React.useState(false);

  const orderedSets = React.useMemo(() => orderSets(sets), [sets]);
  const bestThisSession = sets
    .filter((s) => !s.isWarmup)
    .reduce((max, s) => Math.max(max, estimateOneRepMax(s.weightKg, s.reps)), 0);
  const recommendedWarmup = previousSets ? calculateWarmupSet(previousSets, unit) : null;
  const hasWarmupSet = sets.some((s) => s.isWarmup);

  // The warm-up starts blank like the working sets, with the recommendation shown as its
  // placeholder — typing the reps fills in the weight and starts the rest timer.
  async function initializeSets() {
    const warmup = previousSets ? calculateWarmupSet(previousSets, unit) : null;
    if (warmup) {
      await addSet({ workoutId, exerciseId, weightKg: 0, reps: 0, isWarmup: true });
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
      await addSet({ workoutId, exerciseId, weightKg: 0, reps: 0, isWarmup: true });
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

  /** Always describes what comes *after* the rest — "Next: Bench Press · Set 3 of 4", then
   * "Next: Row" once this exercise is done — never the set that was just finished. */
  function restLabel(completedSetId: string) {
    const working = sets.filter((s) => !s.isWarmup);
    const done = working.filter((s) => s.id === completedSetId || isSetComplete(s, exercise)).length;
    if (done < working.length) {
      const nextSet = `Set ${done + 1} of ${working.length}`;
      return exercise?.name ? `Next: ${exercise.name} · ${nextSet}` : `Next: ${nextSet}`;
    }
    if (nextExercise) return `Next: ${nextExercise.name}`;
    return "All sets done · Finish workout";
  }

  function handleSetChange(setId: string, patch: Partial<SetEntry>, isNewlyCompleted: boolean) {
    void updateSet(setId, patch);
    if (isNewlyCompleted) {
      timer.start(restSeconds, restLabel(setId));
    }
  }

  const workingSets = orderedSets.filter((s) => !s.isWarmup);
  const previousWorking = previousSets?.filter((s) => !s.isWarmup) ?? [];

  /** What a row is compared against (placeholder + weight auto-fill): the recommended warm-up for
   * the warm-up row, otherwise the same-numbered working set from last session — or its last one
   * when this session runs longer. */
  function previousFor(s: SetEntry): { weightKg: number; reps: number } | undefined {
    if (s.isWarmup) return recommendedWarmup ?? undefined;
    const n = workingSets.indexOf(s);
    return previousWorking[n] ?? previousWorking[previousWorking.length - 1];
  }

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
          onClick={() => {
            // One stray tap shouldn't silently throw away logged sets — confirm only when there are some.
            if (sets.some((s) => isSetComplete(s, exercise))) setConfirmRemove(true);
            else void removeExerciseFromWorkout(workoutId, exerciseId);
          }}
          className="relative flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hit-slop-44 hover:bg-secondary hover:text-destructive"
        >
          <X size={14} />
        </button>
        <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {exercise?.name ?? "this exercise"}?</AlertDialogTitle>
              <AlertDialogDescription>The sets you&apos;ve logged for it in this workout will be deleted.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => void removeExerciseFromWorkout(workoutId, exerciseId)}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
        {orderedSets.map((s) => {
          return (
            <SetRow
              key={s.id}
              index={s.isWarmup ? 0 : workingSets.indexOf(s) + 1}
              unit={unit}
              set={s}
              complete={isSetComplete(s, exercise)}
              showPlateCalculator={!exercise || exercise.equipment === "barbell"}
              previous={previousFor(s)}
              onChange={(patch) => {
                const willBeComplete = isSetComplete({ ...s, ...patch }, exercise);
                const wasComplete = isSetComplete(s, exercise);
                handleSetChange(s.id, patch, willBeComplete && !wasComplete);
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
