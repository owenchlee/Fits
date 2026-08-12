"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Reorder } from "framer-motion";
import { DotsSixVertical, Plus, Trash, X } from "@phosphor-icons/react/dist/ssr";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import { createCustomProgram } from "@/lib/db/repo";
import { generateId } from "@/lib/id";
import { ExercisePicker } from "@/components/shared/exercise-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DraftExercise {
  key: string;
  exerciseId: string;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
}

interface DraftDay {
  name: string;
  exercises: DraftExercise[];
}

function ExerciseName({ id }: { id: string }) {
  const exercise = useLiveQuery(() => db.exercises.get(id), [id]);
  return <span>{exercise?.name ?? "…"}</span>;
}

export function ProgramBuilderDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [days, setDays] = React.useState<DraftDay[]>([{ name: "Day 1", exercises: [] }]);

  function reset() {
    setName("");
    setDescription("");
    setDays([{ name: "Day 1", exercises: [] }]);
  }

  function addDay() {
    setDays((d) => [...d, { name: `Day ${d.length + 1}`, exercises: [] }]);
  }

  function removeDay(index: number) {
    setDays((d) => d.filter((_, i) => i !== index));
  }

  function updateDayName(index: number, value: string) {
    setDays((d) => d.map((day, i) => (i === index ? { ...day, name: value } : day)));
  }

  function addExerciseToDay(dayIndex: number, exerciseId: string) {
    setDays((d) =>
      d.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              exercises: [
                ...day.exercises,
                { key: generateId(), exerciseId, targetSets: 3, targetReps: "8-12", restSeconds: 90 },
              ],
            }
          : day
      )
    );
  }

  function reorderExercises(dayIndex: number, newOrder: DraftExercise[]) {
    setDays((d) => d.map((day, i) => (i === dayIndex ? { ...day, exercises: newOrder } : day)));
  }

  function updateExercise(dayIndex: number, exIndex: number, patch: Partial<DraftExercise>) {
    setDays((d) =>
      d.map((day, i) =>
        i === dayIndex
          ? { ...day, exercises: day.exercises.map((ex, j) => (j === exIndex ? { ...ex, ...patch } : ex)) }
          : day
      )
    );
  }

  function removeExercise(dayIndex: number, exIndex: number) {
    setDays((d) =>
      d.map((day, i) => (i === dayIndex ? { ...day, exercises: day.exercises.filter((_, j) => j !== exIndex) } : day))
    );
  }

  const canSave = name.trim().length > 0 && days.some((d) => d.exercises.length > 0);

  async function handleSave() {
    const id = await createCustomProgram({
      name: name.trim(),
      description: description.trim() || "Custom program",
      days: days
        .filter((d) => d.exercises.length > 0)
        .map((d) => ({
          name: d.name,
          exercises: d.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            restSeconds: ex.restSeconds,
          })),
        })),
    });
    setOpen(false);
    reset();
    router.push(`/programs/${id}`);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Plus size={16} /> Create program
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Build a custom program</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="program-name">Name</Label>
              <Input id="program-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Program" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="program-desc">Description</Label>
              <Input
                id="program-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this for?"
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="space-y-3">
            {days.map((day, dayIndex) => (
              <div key={dayIndex} className="rounded-xl border border-border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Input
                    value={day.name}
                    onChange={(e) => updateDayName(dayIndex, e.target.value)}
                    className="h-8 max-w-[10rem] font-display font-semibold"
                  />
                  {days.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDay(dayIndex)}
                      className="ml-auto flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"
                      aria-label={`Remove ${day.name}`}
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {day.exercises.length > 0 && (
                    <div className="flex items-center gap-1.5 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <span className="w-3.5 shrink-0" />
                      <span className="min-w-0 flex-1">Exercise</span>
                      <span className="w-12 shrink-0 text-center">Sets</span>
                      <span className="w-3 shrink-0 text-center">×</span>
                      <span className="w-16 shrink-0 text-center">Reps</span>
                      <span className="w-16 shrink-0 text-center">Rest (s)</span>
                      <span className="w-7 shrink-0" />
                    </div>
                  )}
                  <Reorder.Group
                    axis="y"
                    values={day.exercises}
                    onReorder={(newOrder) => reorderExercises(dayIndex, newOrder)}
                    className="list-none space-y-1.5"
                  >
                    {day.exercises.map((ex, exIndex) => (
                      <Reorder.Item
                        key={ex.key}
                        value={ex}
                        className="flex flex-wrap items-center gap-1.5 rounded-lg bg-secondary/50 p-1.5"
                      >
                        <DotsSixVertical
                          size={16}
                          weight="bold"
                          className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
                        />
                        <span className="min-w-0 flex-1 truncate px-1.5 text-sm font-medium">
                          <ExerciseName id={ex.exerciseId} />
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={ex.targetSets === 0 ? "" : ex.targetSets}
                          onChange={(e) =>
                            updateExercise(dayIndex, exIndex, {
                              targetSets: e.target.value === "" ? 0 : Number(e.target.value),
                            })
                          }
                          className="h-8 w-12 rounded-md border border-input bg-background text-center text-xs tabular-nums"
                          aria-label="Target sets"
                        />
                        <span className="text-xs text-muted-foreground">×</span>
                        <input
                          value={ex.targetReps}
                          onChange={(e) => updateExercise(dayIndex, exIndex, { targetReps: e.target.value })}
                          className="h-8 w-16 rounded-md border border-input bg-background text-center text-xs"
                          aria-label="Target reps"
                        />
                        <input
                          type="number"
                          min={0}
                          step={15}
                          value={ex.restSeconds === 0 ? "" : ex.restSeconds}
                          onChange={(e) =>
                            updateExercise(dayIndex, exIndex, {
                              restSeconds: e.target.value === "" ? 0 : Number(e.target.value),
                            })
                          }
                          className="h-8 w-16 rounded-md border border-input bg-background text-center text-xs tabular-nums"
                          aria-label="Rest seconds"
                          title="Rest (seconds)"
                        />
                        <button
                          type="button"
                          onClick={() => removeExercise(dayIndex, exIndex)}
                          className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-destructive"
                          aria-label="Remove exercise"
                        >
                          <X size={13} />
                        </button>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </div>

                <div className="mt-2">
                  <ExercisePicker
                    triggerLabel="Add exercise to day"
                    addedIds={day.exercises.map((ex) => ex.exerciseId)}
                    onSelect={(exercise) => addExerciseToDay(dayIndex, exercise.id)}
                    trigger={
                      <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
                        <Plus size={14} /> Add exercise
                      </Button>
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addDay}>
            <Plus size={14} /> Add day
          </Button>
        </div>

        <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save program
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
