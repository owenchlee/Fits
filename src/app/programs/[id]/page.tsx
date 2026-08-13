"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Reorder } from "framer-motion";
import { CaretLeft, DotsSixVertical, PlayCircle, Plus, Trash, X } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/db";
import { useActiveWorkout, useProgram, useSettings } from "@/lib/db/hooks";
import { deleteProgram, setActiveProgram, startWorkout, updateProgram } from "@/lib/db/repo";
import { ExercisePicker } from "@/components/shared/exercise-picker";
import type { ProgramDay, ProgramExercise } from "@/lib/db/types";
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
        {sets} {reps ? `× ${reps}` : "sets"}
      </span>
    </li>
  );
}

function EditableExerciseRow({
  ex,
  onChange,
  onRemove,
}: {
  ex: ProgramExercise;
  onChange: (patch: Partial<ProgramExercise>) => void;
  onRemove: () => void;
}) {
  const exercise = useLiveQuery(() => db.exercises.get(ex.exerciseId), [ex.exerciseId]);
  return (
    <Reorder.Item
      value={ex}
      className="flex flex-wrap items-center gap-1.5 rounded-lg bg-secondary/50 p-1.5"
    >
      <DotsSixVertical
        size={16}
        weight="bold"
        className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
      />
      <span className="min-w-0 flex-1 truncate px-1.5 text-sm font-medium">{exercise?.name ?? "…"}</span>
      <input
        type="number"
        min={1}
        value={ex.targetSets === 0 ? "" : ex.targetSets}
        onChange={(e) => onChange({ targetSets: e.target.value === "" ? 0 : Number(e.target.value) })}
        className="h-8 w-12 rounded-md border border-input bg-background text-center text-xs tabular-nums"
        aria-label="Target sets"
      />
      <button
        type="button"
        onClick={onRemove}
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-destructive"
        aria-label="Remove exercise"
      >
        <X size={13} />
      </button>
    </Reorder.Item>
  );
}

function EditableDayCard({
  day,
  onChange,
}: {
  day: ProgramDay;
  onChange: (day: ProgramDay) => void;
}) {
  function updateExercise(exerciseId: string, patch: Partial<ProgramExercise>) {
    onChange({
      ...day,
      exercises: day.exercises.map((e) => (e.exerciseId === exerciseId ? { ...e, ...patch } : e)),
    });
  }

  function removeExercise(exerciseId: string) {
    onChange({ ...day, exercises: day.exercises.filter((e) => e.exerciseId !== exerciseId) });
  }

  function addExercise(exerciseId: string) {
    onChange({
      ...day,
      exercises: [...day.exercises, { exerciseId, targetSets: 3, targetReps: "" }],
    });
  }

  return (
    <div>
      {day.exercises.length > 0 && (
        <div className="mb-1.5 flex items-center gap-1.5 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="w-3.5 shrink-0" />
          <span className="min-w-0 flex-1">Exercise</span>
          <span className="w-12 shrink-0 text-center">Sets</span>
          <span className="w-7 shrink-0" />
        </div>
      )}
      <Reorder.Group
        axis="y"
        values={day.exercises}
        onReorder={(newOrder) => onChange({ ...day, exercises: newOrder })}
        className="list-none space-y-1.5"
      >
        {day.exercises.map((ex) => (
          <EditableExerciseRow
            key={ex.exerciseId}
            ex={ex}
            onChange={(patch) => updateExercise(ex.exerciseId, patch)}
            onRemove={() => removeExercise(ex.exerciseId)}
          />
        ))}
      </Reorder.Group>

      <div className="mt-2">
        <ExercisePicker
          triggerLabel="Add exercise to day"
          addedIds={day.exercises.map((e) => e.exerciseId)}
          onSelect={(exercise) => addExercise(exercise.id)}
          trigger={
            <Button type="button" variant="outline" size="sm">
              <Plus size={14} /> Add exercise
            </Button>
          }
        />
      </div>
    </div>
  );
}

export default function ProgramDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const program = useProgram(params.id);
  const settings = useSettings();
  const activeWorkout = useActiveWorkout();

  const [localDays, setLocalDays] = React.useState<ProgramDay[] | null>(null);
  const loadedIdRef = React.useRef<string | null>(null);
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (program && loadedIdRef.current !== program.id) {
      setLocalDays(program.days);
      loadedIdRef.current = program.id;
    }
  }, [program]);

  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (!program) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  const isActive = settings.activeProgramId === program.id;
  const days = localDays ?? program.days;

  function handleDayChange(dayIndex: number, updatedDay: ProgramDay) {
    const next = days.map((d, i) => (i === dayIndex ? updatedDay : d));
    setLocalDays(next);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateProgram(program!.id, { days: next });
    }, 500);
  }

  async function handleStartDay(dayIndex: number) {
    const day = days[dayIndex];
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
        {days.map((day, i) => (
          <div key={day.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
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
            {program.isCustom ? (
              <EditableDayCard day={day} onChange={(updated) => handleDayChange(i, updated)} />
            ) : (
              <ul className="divide-y divide-border">
                {day.exercises.map((ex) => (
                  <DayExerciseRow key={ex.exerciseId} exerciseId={ex.exerciseId} sets={ex.targetSets} reps={ex.targetReps} />
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
