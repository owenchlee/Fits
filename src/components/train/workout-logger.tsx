"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import { useSettings, useWorkoutSets } from "@/lib/db/hooks";
import { Barbell } from "@phosphor-icons/react/dist/ssr";
import { ElapsedTimer } from "@/components/train/elapsed-timer";
import { ExerciseSessionCard } from "@/components/train/exercise-session-card";
import { ExercisePicker } from "@/components/shared/exercise-picker";
import { addExerciseToWorkout } from "@/lib/db/repo";
import { FinishWorkoutDialog } from "@/components/train/finish-workout-dialog";
import { DiscardWorkoutButton } from "@/components/train/discard-workout-button";
import { EmptyState } from "@/components/shared/empty-state";

export function WorkoutLogger({ workoutId }: { workoutId: string }) {
  const settings = useSettings();
  const workout = useLiveQuery(() => db.workouts.get(workoutId), [workoutId]);
  const program = useLiveQuery(
    () => (workout?.programId ? db.programs.get(workout.programId) : undefined),
    [workout?.programId]
  );
  const sets = useWorkoutSets(workoutId);

  if (!workout) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Loading workout…
      </div>
    );
  }

  const programDay = program?.days.find((d) => d.name === workout.programDayName);

  return (
    <div className="pb-24">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ElapsedTimer startedAt={workout.startedAt} /> elapsed
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{workout.title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <DiscardWorkoutButton workoutId={workoutId} />
          <FinishWorkoutDialog
            workoutId={workoutId}
            startedAt={workout.startedAt}
            sets={sets}
            unit={settings.unitSystem}
            disabled={workout.exerciseOrder.length === 0}
          />
        </div>
      </div>

      {workout.exerciseOrder.length === 0 ? (
        <EmptyState
          icon={Barbell}
          title="No exercises yet"
          description="Add your first exercise to start logging sets."
        />
      ) : (
        <div className="space-y-4">
          {workout.exerciseOrder.map((exerciseId) => {
            const target = programDay?.exercises.find((e) => e.exerciseId === exerciseId);
            return (
              <ExerciseSessionCard
                key={exerciseId}
                workoutId={workoutId}
                exerciseId={exerciseId}
                targetSets={target?.targetSets}
                targetReps={target?.targetReps}
                restSeconds={target?.restSeconds ?? settings.defaultRestSeconds}
                unit={settings.unitSystem}
                sets={sets.filter((s) => s.exerciseId === exerciseId)}
              />
            );
          })}
        </div>
      )}

      <div className="mt-4">
        <ExercisePicker
          addedIds={workout.exerciseOrder}
          onSelect={(exercise) => addExerciseToWorkout(workoutId, exercise.id)}
        />
      </div>
    </div>
  );
}
