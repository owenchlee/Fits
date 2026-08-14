"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { CaretLeft, Trash } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/db";
import { useSettings, useWorkoutSets } from "@/lib/db/hooks";
import { deleteWorkout, updateSet } from "@/lib/db/repo";
import { toTotalLoadKg } from "@/lib/calc/load";
import { toDisplayWeight, fromDisplayWeight, formatWeight } from "@/lib/calc/units";
import { sanitizeDecimalInput, sanitizeIntegerInput } from "@/lib/format";
import type { SetEntry, UnitSystem } from "@/lib/db/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function WorkoutDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const settings = useSettings();
  const workout = useLiveQuery(() => db.workouts.get(params.id), [params.id]);
  const sets = useWorkoutSets(params.id);
  const exercises = useLiveQuery(
    () => db.exercises.bulkGet(workout?.exerciseOrder ?? []),
    [workout]
  );

  if (!workout) return <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>;

  const exerciseById = new Map((exercises ?? []).filter((e) => !!e).map((e) => [e!.id, e!]));
  const durationMin = workout.completedAt ? Math.round((workout.completedAt - workout.startedAt) / 60000) : 0;
  const volumeKg = sets
    .filter((s) => !s.isWarmup)
    .reduce((sum, s) => sum + toTotalLoadKg(s.weightKg, exerciseById.get(s.exerciseId)) * s.reps, 0);

  return (
    <div className="pb-6">
      <Link href="/statistics?tab=history" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <CaretLeft size={14} /> History
      </Link>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{workout.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(workout.startedAt).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} ·{" "}
            {durationMin} min · {formatWeight(volumeKg, settings.unitSystem, { decimals: 0 })} volume
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button aria-label="Delete workout" className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive">
              <Trash size={16} />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this workout?</AlertDialogTitle>
              <AlertDialogDescription>All logged sets will be permanently removed.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  await deleteWorkout(workout.id);
                  router.push("/statistics?tab=history");
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <WorkoutExerciseBreakdown exerciseOrder={workout.exerciseOrder} sets={sets} unit={settings.unitSystem} />
    </div>
  );
}

function WorkoutExerciseBreakdown({
  exerciseOrder,
  sets,
  unit,
}: {
  exerciseOrder: string[];
  sets: ReturnType<typeof useWorkoutSets>;
  unit: ReturnType<typeof useSettings>["unitSystem"];
}) {
  return (
    <div className="space-y-3">
      {exerciseOrder.map((exerciseId) => (
        <ExerciseBlock key={exerciseId} exerciseId={exerciseId} sets={sets.filter((s) => s.exerciseId === exerciseId)} unit={unit} />
      ))}
    </div>
  );
}

function ExerciseBlock({
  exerciseId,
  sets,
  unit,
}: {
  exerciseId: string;
  sets: ReturnType<typeof useWorkoutSets>;
  unit: ReturnType<typeof useSettings>["unitSystem"];
}) {
  const exercise = useLiveQuery(() => db.exercises.get(exerciseId), [exerciseId]);
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="font-display text-lg font-bold">{exercise?.name ?? "…"}</p>
      <div className="mt-2 space-y-1">
        {sets.map((s, i) => (
          <EditableSetRow key={s.id} set={s} index={i + 1} unit={unit} />
        ))}
      </div>
    </div>
  );
}

function EditableSetRow({ set, index, unit }: { set: SetEntry; index: number; unit: UnitSystem }) {
  const [weightStr, setWeightStr] = React.useState(() => String(round1(toDisplayWeight(set.weightKg, unit))));
  const [repsStr, setRepsStr] = React.useState(() => String(set.reps));

  React.useEffect(() => {
    setWeightStr(String(round1(toDisplayWeight(set.weightKg, unit))));
  }, [set.weightKg, unit]);

  React.useEffect(() => {
    setRepsStr(String(set.reps));
  }, [set.reps]);

  function commitWeight(value: string) {
    const cleaned = sanitizeDecimalInput(value);
    setWeightStr(cleaned);
    const n = parseFloat(cleaned);
    if (!Number.isNaN(n) && n >= 0) void updateSet(set.id, { weightKg: fromDisplayWeight(n, unit) });
  }

  function commitReps(value: string) {
    const cleaned = sanitizeIntegerInput(value);
    setRepsStr(cleaned);
    const n = parseInt(cleaned, 10);
    if (!Number.isNaN(n) && n >= 0) void updateSet(set.id, { reps: n });
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{set.isWarmup ? "W" : index}</span>
      <input
        inputMode="decimal"
        value={weightStr}
        onChange={(e) => commitWeight(e.target.value)}
        aria-label={`Set ${index} weight (${unit})`}
        className="h-8 w-16 rounded-lg border border-transparent bg-secondary px-2 text-center text-sm font-medium tabular-nums focus:border-ring focus:bg-background focus:outline-none"
      />
      <span className="text-muted-foreground">×</span>
      <input
        inputMode="numeric"
        value={repsStr}
        onChange={(e) => commitReps(e.target.value)}
        aria-label={`Set ${index} reps`}
        className="h-8 w-12 rounded-lg border border-transparent bg-secondary px-2 text-center text-sm font-medium tabular-nums focus:border-ring focus:bg-background focus:outline-none"
      />
      {set.rpe && <span className="tabular-nums text-muted-foreground">RPE {set.rpe}</span>}
    </div>
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
