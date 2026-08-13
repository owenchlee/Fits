"use client";

import * as React from "react";
import { Check, MagnifyingGlass, Plus } from "@phosphor-icons/react/dist/ssr";
import { useExercises } from "@/lib/db/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddExerciseDialog } from "@/components/shared/add-exercise-dialog";
import { cn } from "@/lib/utils";
import type { Exercise } from "@/lib/db/types";

const MUSCLE_FILTERS = [
  "all",
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "core",
] as const;

export function ExercisePicker({
  addedIds = [],
  onSelect,
  trigger,
  triggerLabel = "Add exercise",
}: {
  addedIds?: string[];
  onSelect: (exercise: Exercise) => void;
  trigger?: React.ReactNode;
  triggerLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [muscle, setMuscle] = React.useState<(typeof MUSCLE_FILTERS)[number]>("all");
  const exercises = useExercises();

  const filtered = exercises.filter((e) => {
    const matchesQuery = e.name.toLowerCase().includes(query.toLowerCase());
    const matchesMuscle = muscle === "all" || e.primaryMuscle === muscle;
    return matchesQuery && matchesMuscle;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="w-full" type="button">
            <Plus size={16} /> {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border p-4 pb-3">
          <DialogTitle>{triggerLabel}</DialogTitle>
          <div className="relative mt-1">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises"
              className="h-10 w-full rounded-lg border border-input bg-secondary pl-9 pr-3 text-sm focus:border-ring focus:outline-none"
            />
          </div>
          <div className="-mx-1 mt-2 flex flex-wrap gap-1.5 px-1 pb-1">
            {MUSCLE_FILTERS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMuscle(m)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                  muscle === m ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">No exercises match.</p>
          )}
          {filtered.map((ex) => {
            const added = addedIds.includes(ex.id);
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => {
                  onSelect(ex);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left hover:bg-secondary"
              >
                <div>
                  <p className="text-sm font-medium">{ex.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {ex.primaryMuscle} · {ex.equipment}
                  </p>
                </div>
                {added && <Check size={16} className="shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>

        <div className="shrink-0 border-t border-border p-2">
          <AddExerciseDialog
            trigger={
              <Button type="button" variant="ghost" size="sm" className="w-full justify-center text-muted-foreground">
                <Plus size={14} /> Can&apos;t find it? Add a custom exercise
              </Button>
            }
            onCreated={(exercise) => {
              onSelect(exercise);
              setOpen(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
