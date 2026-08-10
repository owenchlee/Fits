"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { CaretLeft, PlayCircle, Trash } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/db";
import { useActiveWorkout, useProgram, useSettings } from "@/lib/db/hooks";
import { deleteProgram, setActiveProgram, startWorkout } from "@/lib/db/repo";
import { Button } from "@/components/ui/button";
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

function DayExerciseRow({ exerciseId, sets, reps }: { exerciseId: string; sets: number; reps: string }) {
  const exercise = useLiveQuery(() => db.exercises.get(exerciseId), [exerciseId]);
  return (
    <li className="flex items-center justify-between py-1.5 text-sm">
      <span>{exercise?.name ?? "…"}</span>
      <span className="tabular-nums text-muted-foreground">
        {sets} × {reps}
      </span>
    </li>
  );
}

export default function ProgramDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const program = useProgram(params.id);
  const settings = useSettings();
  const activeWorkout = useActiveWorkout();

  if (!program) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  const isActive = settings.activeProgramId === program.id;

  async function handleStartDay(dayIndex: number) {
    const day = program!.days[dayIndex];
    const id = await startWorkout({
      programId: program!.id,
      programDayName: day.name,
      title: `${program!.name} — ${day.name}`,
      exerciseOrder: day.exercises.map((e) => e.exerciseId),
    });
    router.push(`/train?workoutId=${id}`);
  }

  return (
    <div className="pb-6">
      <Link href="/programs" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <CaretLeft size={14} /> Programs
      </Link>

      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{program.name}</h1>
          <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">{program.description}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {program.days.length} day split · by {program.author}
          </p>
        </div>
        {program.isCustom && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                aria-label="Delete program"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"
              >
                <Trash size={16} />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {program.name}?</AlertDialogTitle>
                <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    await deleteProgram(program.id);
                    router.push("/programs");
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Button
        variant={isActive ? "secondary" : "default"}
        size="lg"
        className="mb-6"
        onClick={() => setActiveProgram(isActive ? undefined : program.id)}
      >
        {isActive ? "Currently active — tap to unset" : "Set as active program"}
      </Button>

      <div className="space-y-4">
        {program.days.map((day, i) => (
          <div key={day.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold">{day.name}</h2>
              <Button
                size="sm"
                variant="outline"
                disabled={!!activeWorkout}
                onClick={() => handleStartDay(i)}
              >
                <PlayCircle size={14} /> Start
              </Button>
            </div>
            <ul className="divide-y divide-border">
              {day.exercises.map((ex) => (
                <DayExerciseRow key={ex.exerciseId} exerciseId={ex.exerciseId} sets={ex.targetSets} reps={ex.targetReps} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
