"use client";

import * as React from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, TrendUp, X } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/db";
import { addSet, deleteSet, getLastPerformance, updateSet, removeExerciseFromWorkout } from "@/lib/db/repo";
import { useRestTimer } from "@/lib/timer/rest-timer-context";
import { estimateOneRepMax } from "@/lib/calc/one-rep-max";
import { formatWeight } from "@/lib/calc/units";
import type { SetEntry, UnitSystem } from "@/lib/db/types";
import { SetRow } from "@/components/train/set-row";
import { Button } from "@/components/ui/button";

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

  const bestThisSession = sets.reduce((max, s) => Math.max(max, estimateOneRepMax(s.weightKg, s.reps)), 0);

  async function handleAddSet() {
    const last = sets[sets.length - 1];
    const prev = previousSets?.[sets.length];
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
                Target {targetSets} × {targetReps}
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

      <div className="space-y-1">
        {sets.map((s, i) => (
          <SetRow
            key={s.id}
            index={i + 1}
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
        ))}
      </div>

      <Button variant="ghost" size="sm" className="mt-2 w-full justify-center text-muted-foreground" onClick={handleAddSet}>
        <Plus size={15} /> Add set
      </Button>
    </div>
  );
}
