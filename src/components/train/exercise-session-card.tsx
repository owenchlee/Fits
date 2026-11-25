"use client";

import * as React from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowDown, ArrowUp, ArrowsLeftRight, Plus, TrendUp, X } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/db";
import {
  addSet,
  deleteSet,
  getLastPerformance,
  updateSet,
  removeExerciseFromWorkout,
  moveExerciseInWorkout,
  replaceExerciseInWorkout,
} from "@/lib/db/repo";
import { ExercisePicker } from "@/components/shared/exercise-picker";
import { saveOrToast } from "@/lib/save";
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
  canMoveUp = false,
  canMoveDown = false,
  addedIds,
  targetSets,
  targetReps,
  targetRpe,
  restSeconds,
  unit,
  sets,
}: {
  workoutId: string;
  exerciseId: string;
  nextExerciseId?: string;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  addedIds?: string[];
  targetSets?: number;
  targetReps?: string;
  targetRpe?: number;
  restSeconds: number;
  unit: UnitSystem;
  sets: SetEntry[];
}) {
  const exercise = useLiveQuery(() => db.exercises.get(exerciseId).then((e) => e ?? null), [exerciseId]);
  const nextExercise = useLiveQuery(
    () => (nextExerciseId ? db.exercises.get(nextExerciseId) : undefined),
    [nextExerciseId]
  );
  // Fetched once per exercise/workout: the previous session does not change while lifting.
  const [previousSets, setPreviousSets] = React.useState<SetEntry[]>();
  React.useEffect(() => {
    let cancelled = false;
    getLastPerformance(exerciseId, workoutId).then((r) => {
      if (!cancelled) setPreviousSets(r);
    });
    return () => {
      cancelled = true;
    };
  }, [exerciseId, workoutId]);
  const timer = useRestTimer();
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [pendingSwapId, setPendingSwapId] = React.useState<string | null>(null);

  const orderedSets = React.useMemo(() => orderSets(sets), [sets]);
  const bestThisSession = sets
    .filter((s) => !s.isWarmup)
    .reduce((max, s) => Math.max(max, estimateOneRepMax(s.weightKg, s.reps)), 0);
  const recommendedWarmup = previousSets ? calculateWarmupSet(previousSets, unit, exercise?.equipment) : null;
  const hasWarmupSet = sets.some((s) => s.isWarmup);

  // The warm-up starts blank like the working sets, with the recommendation shown as its
  // placeholder — typing the reps fills in the weight and starts the rest timer.
  async function initializeSets() {
    const warmup = previousSets ? calculateWarmupSet(previousSets, unit, exercise?.equipment) : null;
    if (warmup) {
      await addSet({ workoutId, exerciseId, weightKg: 0, reps: 0, isWarmup: true });
    }
    for (let i = 0; i < (targetSets ?? 0); i++) {
      await addSet({ workoutId, exerciseId, weightKg: 0, reps: 0 });
    }
  }

  const hasInitializedRef = React.useRef(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const removeBtnRef = React.useRef<HTMLButtonElement>(null);

  // The card unmounts on removal, so hand focus to another control on the page first (WCAG 2.4.3).
  function removeAndKeepFocus() {
    const others = Array.from(document.querySelectorAll<HTMLElement>("main button")).filter(
      (b) => !cardRef.current?.contains(b),
    );
    const next = others.find((b) => b.dataset.removeExercise !== undefined) ?? others[0];
    // Focus after the removal lands: an open dialog would otherwise trap focus back inside itself.
    void saveOrToast(() => removeExerciseFromWorkout(workoutId, exerciseId)).then(() => setTimeout(() => next?.focus(), 0));
  }
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
    await saveOrToast(() => addSet({ workoutId, exerciseId, weightKg, reps }));
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
    void saveOrToast(() => updateSet(setId, patch));
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
    <div ref={cardRef} className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div>
          <Link href={`/exercises/${exerciseId}`} className="font-display text-lg font-bold hover:text-primary">
            {exercise?.name ?? (exercise === null ? "Deleted exercise" : "…")}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {targetSets && (
              <span>
                Target {targetSets}
                {targetReps ? ` × ${targetReps}` : " sets"}
                {targetRpe ? ` @${targetRpe}` : ""}
              </span>
            )}
            {bestThisSession > 0 && (
              <span className="flex items-center gap-1 text-primary">
                <TrendUp size={12} weight="bold" /> {formatWeight(bestThisSession, unit, { decimals: 0 })} e1RM
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={`Move ${exercise?.name ?? "exercise"} up`}
          disabled={!canMoveUp}
          onClick={() => void saveOrToast(() => moveExerciseInWorkout(workoutId, exerciseId, -1))}
          className="relative flex size-7 items-center justify-center rounded-full text-muted-foreground hit-slop-44 hover:bg-secondary hover:text-foreground disabled:opacity-30"
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button"
          aria-label={`Move ${exercise?.name ?? "exercise"} down`}
          disabled={!canMoveDown}
          onClick={() => void saveOrToast(() => moveExerciseInWorkout(workoutId, exerciseId, 1))}
          className="relative flex size-7 items-center justify-center rounded-full text-muted-foreground hit-slop-44 hover:bg-secondary hover:text-foreground disabled:opacity-30"
        >
          <ArrowDown size={14} />
        </button>
        <ExercisePicker
          addedIds={addedIds}
          triggerLabel="Swap exercise"
          onSelect={(next) => {
            // Swapping deletes this exercise's sets, so confirm when any are logged.
            if (sets.some((s) => isSetComplete(s, exercise))) setPendingSwapId(next.id);
            else void saveOrToast(() => replaceExerciseInWorkout(workoutId, exerciseId, next.id));
          }}
          trigger={
            <button
              type="button"
              aria-label={`Swap ${exercise?.name ?? "exercise"}`}
              className="relative flex size-7 items-center justify-center rounded-full text-muted-foreground hit-slop-44 hover:bg-secondary hover:text-foreground"
            >
              <ArrowsLeftRight size={14} />
            </button>
          }
        />
        <button
          ref={removeBtnRef}
          data-remove-exercise=""
          aria-label={`Remove ${exercise?.name ?? "exercise"} from workout`}
          onClick={() => {
            // One stray tap shouldn't silently throw away logged sets — confirm only when there are some.
            if (sets.some((s) => isSetComplete(s, exercise))) setConfirmRemove(true);
            else removeAndKeepFocus();
          }}
          className="relative flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hit-slop-44 hover:bg-secondary hover:text-destructive"
        >
          <X size={14} />
        </button>
        </div>
        <AlertDialog open={pendingSwapId !== null} onOpenChange={(o) => !o && setPendingSwapId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Swap {exercise?.name ?? "this exercise"}?</AlertDialogTitle>
              <AlertDialogDescription>The sets you&apos;ve logged for it in this workout will be deleted.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  const next = pendingSwapId;
                  if (next) void saveOrToast(() => replaceExerciseInWorkout(workoutId, exerciseId, next));
                }}
              >
                Swap
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
          <AlertDialogContent
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              removeBtnRef.current?.focus();
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {exercise?.name ?? "this exercise"}?</AlertDialogTitle>
              <AlertDialogDescription>The sets you&apos;ve logged for it in this workout will be deleted.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={removeAndKeepFocus}
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
              onDelete={() => {
                // The row unmounts, so park focus on this card's Add set button (WCAG 2.4.3).
                void deleteSet(s.id).then(() => setTimeout(() => cardRef.current?.querySelector<HTMLElement>("[data-add-set]")?.focus(), 0));
              }}
            />
          );
        })}
      </div>

      <Button variant="ghost" size="sm" data-add-set="" className="mt-2 w-full justify-center text-muted-foreground" onClick={handleAddSet}>
        <Plus size={15} /> Add set
      </Button>
    </div>
  );
}
