"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowCounterClockwise, Barbell, CaretLeft, Trash } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/shared/empty-state";
import { db } from "@/lib/db/db";
import { useActiveWorkout, useSettings, useWorkoutSets } from "@/lib/db/hooks";
import { saveOrToast } from "@/lib/save";
import { deleteWorkout, repeatWorkout, updateSet } from "@/lib/db/repo";
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
  const activeWorkout = useActiveWorkout();
  // null = confirmed missing, undefined = still loading
  const workout = useLiveQuery(async () => (await db.workouts.get(params.id)) ?? null, [params.id]);
  const sets = useWorkoutSets(params.id);
  const exercises = useLiveQuery(
    () => db.exercises.bulkGet(workout?.exerciseOrder ?? []),
    [workout]
  );

  if (workout === null) {
    return (
      <EmptyState
        icon={Barbell}
        title="Workout not found"
        description="This workout no longer exists. It may have been deleted."
        action={
          <Link href="/statistics?tab=history" className="text-sm font-medium text-primary">
            Back to history
          </Link>
        }
      />
    );
  }
  if (!workout) return <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>;

  const exerciseById = new Map((exercises ?? []).filter((e) => !!e).map((e) => [e!.id, e!]));
  const durationMin = workout.completedAt ? Math.max(0, Math.round((workout.completedAt - workout.startedAt) / 60000)) : 0;
  const volumeKg = sets
    .filter((s) => !s.isWarmup)
    .reduce((sum, s) => sum + toTotalLoadKg(s.weightKg, exerciseById.get(s.exerciseId)) * s.reps, 0);

  // Bodyweight-only sessions have no load to multiply, so report reps instead of "0 lb".
  const volumeLabel =
    volumeKg > 0
      ? `${formatWeight(volumeKg, settings.unitSystem, { decimals: 0 })} volume`
      : `${sets.filter((s) => !s.isWarmup).reduce((sum, s) => sum + s.reps, 0)} reps`;

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
            {durationMin} min · {volumeLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
        <button
          aria-label="Do this workout again"
          disabled={!!activeWorkout}
          onClick={async () => {
            let id: string | undefined;
            if (await saveOrToast(async () => { id = await repeatWorkout(workout.id); })) {
              if (id) router.push(`/train?workoutId=${id}`);
            }
          }}
          className="flex h-9 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
        >
          <ArrowCounterClockwise size={16} /> Do again
        </button>
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
                  if (await saveOrToast(() => deleteWorkout(workout.id))) router.push("/statistics?tab=history");
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>

      {workout.notes && <p className="mb-4 whitespace-pre-wrap rounded-lg bg-secondary/50 px-3 py-2 text-sm">{workout.notes}</p>}

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
  const exercise = useLiveQuery(() => db.exercises.get(exerciseId).then((e) => e ?? null), [exerciseId]);
  // Warm-ups first, like the logger; working sets are numbered among themselves.
  const ordered = [...sets].sort((a, b) =>
    a.isWarmup !== b.isWarmup ? (a.isWarmup ? -1 : 1) : a.completedAt - b.completedAt,
  );
  const working = ordered.filter((s) => !s.isWarmup);
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="font-display text-lg font-bold">{exercise?.name ?? (exercise === null ? "Deleted exercise" : "…")}</p>
      <div className="mt-2 space-y-1">
        {ordered.map((s) => (
          <EditableSetRow key={s.id} set={s} index={s.isWarmup ? 0 : working.indexOf(s) + 1} unit={unit} />
        ))}
      </div>
    </div>
  );
}

function EditableSetRow({ set, index, unit }: { set: SetEntry; index: number; unit: UnitSystem }) {
  const [weightStr, setWeightStr] = React.useState(() => String(round1(toDisplayWeight(set.weightKg, unit))));
  const [repsStr, setRepsStr] = React.useState(() => String(set.reps));

  // Adopt changes that came from elsewhere (a sync from another device, a unit switch), but not
  // the echo of our own keystrokes — re-formatting those would eat a trailing "." mid-typing.
  const storedWeight = round1(toDisplayWeight(set.weightKg, unit));
  const [prevStored, setPrevStored] = React.useState({ weight: storedWeight, reps: set.reps });
  if (storedWeight !== prevStored.weight || set.reps !== prevStored.reps) {
    setPrevStored({ weight: storedWeight, reps: set.reps });
    if (storedWeight !== round1(parseFloat(weightStr) || 0)) setWeightStr(String(storedWeight));
    if (set.reps !== (parseInt(repsStr, 10) || 0)) setRepsStr(String(set.reps));
  }

  function commitWeight(value: string) {
    const cleaned = sanitizeDecimalInput(value);
    setWeightStr(cleaned);
    const n = parseFloat(cleaned);
    void saveOrToast(() => updateSet(set.id, { weightKg: Number.isNaN(n) ? 0 : fromDisplayWeight(n, unit) }));
  }

  function commitReps(value: string) {
    const cleaned = sanitizeIntegerInput(value);
    setRepsStr(cleaned);
    const n = parseInt(cleaned, 10);
    void saveOrToast(() => updateSet(set.id, { reps: Number.isNaN(n) ? 0 : n }));
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{set.isWarmup ? "W" : index}</span>
      <input
        inputMode="decimal"
        value={weightStr}
        onChange={(e) => commitWeight(e.target.value)}
        aria-label={`Set ${index} weight (${unit})`}
        className="h-8 w-16 rounded-lg border border-input bg-secondary px-2 text-center text-sm font-medium tabular-nums focus:border-ring focus:bg-background focus:outline-none"
      />
      <span className="text-muted-foreground">×</span>
      <input
        inputMode="numeric"
        value={repsStr}
        onChange={(e) => commitReps(e.target.value)}
        aria-label={`Set ${index} reps`}
        className="h-8 w-12 rounded-lg border border-input bg-secondary px-2 text-center text-sm font-medium tabular-nums focus:border-ring focus:bg-background focus:outline-none"
      />
      {set.rpe && <span className="tabular-nums text-muted-foreground">RPE {set.rpe}</span>}
      {set.isFailure && <span className="rounded bg-secondary px-1 text-[10px] font-semibold text-muted-foreground">To failure</span>}
      {set.isDropSet && <span className="rounded bg-secondary px-1 text-[10px] font-semibold text-muted-foreground">Drop set</span>}
    </div>
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
