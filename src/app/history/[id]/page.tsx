"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { CaretLeft, Trash } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/db";
import { useSettings, useWorkoutSets } from "@/lib/db/hooks";
import { deleteWorkout } from "@/lib/db/repo";
import { formatWeight } from "@/lib/calc/units";
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

  if (!workout) return <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>;

  const durationMin = workout.completedAt ? Math.round((workout.completedAt - workout.startedAt) / 60000) : 0;
  const volumeKg = sets.filter((s) => !s.isWarmup).reduce((sum, s) => sum + s.weightKg * s.reps, 0);

  return (
    <div className="pb-6">
      <Link href="/history" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
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
                  router.push("/history");
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
          <div key={s.id} className="flex items-center gap-3 text-sm">
            <span className="w-5 text-center text-xs text-muted-foreground">{s.isWarmup ? "W" : i + 1}</span>
            <span className="tabular-nums">{formatWeight(s.weightKg, unit)}</span>
            <span className="text-muted-foreground">×</span>
            <span className="tabular-nums">{s.reps}</span>
            {s.rpe && <span className="tabular-nums text-muted-foreground">RPE {s.rpe}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
