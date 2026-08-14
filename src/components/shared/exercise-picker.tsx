"use client";

import * as React from "react";
import { CaretLeft, CaretRight, Check, Info, MagnifyingGlass, Plus } from "@phosphor-icons/react/dist/ssr";
import { useExercises } from "@/lib/db/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AddExerciseDialog } from "@/components/shared/add-exercise-dialog";
import { cn } from "@/lib/utils";
import type { Exercise, MuscleGroup } from "@/lib/db/types";

/** Collapses the 13 raw muscle groups into a coarser set for the category drill-down —
 * enough categories to feel organized, few enough to fit a single screen without scrolling. */
const CATEGORY_GROUPS: Record<string, MuscleGroup[]> = {
  Chest: ["chest"],
  Back: ["back"],
  Shoulders: ["shoulders", "traps"],
  Biceps: ["biceps"],
  Triceps: ["triceps"],
  Forearms: ["forearms"],
  Legs: ["quads", "hamstrings", "glutes", "calves"],
  Core: ["core"],
  "Full Body": ["full-body"],
};
const CATEGORIES = Object.keys(CATEGORY_GROUPS);

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
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const exercises = useExercises();

  const normalizedQuery = query.trim().toLowerCase();
  const searching = normalizedQuery.length > 0;

  const visibleExercises = searching
    ? exercises.filter((e) => e.name.toLowerCase().includes(normalizedQuery))
    : activeCategory
      ? exercises.filter((e) => CATEGORY_GROUPS[activeCategory].includes(e.primaryMuscle))
      : [];

  function selectExercise(ex: Exercise) {
    onSelect(ex);
    setOpen(false);
  }

  function goBack() {
    setActiveCategory(null);
    setQuery("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setQuery("");
          setActiveCategory(null);
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="w-full" type="button">
            <Plus size={16} /> {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border p-4 pb-3">
          <DialogTitle className="flex items-center gap-1.5">
            {activeCategory && (
              <button
                type="button"
                onClick={goBack}
                aria-label="Back to categories"
                className="-ml-1.5 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <CaretLeft size={16} />
              </button>
            )}
            {activeCategory ?? triggerLabel}
          </DialogTitle>
          <div className="relative mt-1">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={activeCategory ? `Search ${activeCategory}` : "Search exercises"}
              className="h-10 w-full rounded-lg border border-input bg-secondary pl-9 pr-3 text-sm focus:border-ring focus:outline-none"
            />
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {!activeCategory && !searching ? (
            <CategoryList exercises={exercises} onSelectCategory={setActiveCategory} />
          ) : (
            <>
              {visibleExercises.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">No exercises match.</p>
              )}
              {visibleExercises.map((ex) => (
                <ExerciseRow key={ex.id} exercise={ex} added={addedIds.includes(ex.id)} onSelect={selectExercise} />
              ))}
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-border p-2">
          <AddExerciseDialog
            trigger={
              <Button type="button" variant="ghost" size="sm" className="w-full justify-center text-muted-foreground">
                <Plus size={14} /> Can&apos;t find it? Add a custom exercise
              </Button>
            }
            onCreated={selectExercise}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CategoryList({
  exercises,
  onSelectCategory,
}: {
  exercises: Exercise[];
  onSelectCategory: (category: string) => void;
}) {
  return (
    <div>
      {CATEGORIES.map((category) => {
        const muscles = CATEGORY_GROUPS[category];
        const count = exercises.filter((e) => muscles.includes(e.primaryMuscle)).length;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-3.5 text-left hover:bg-secondary"
          >
            <span className="text-sm font-medium">{category}</span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-xs tabular-nums">{count}</span>
              <CaretRight size={14} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ExerciseRow({
  exercise,
  added,
  onSelect,
}: {
  exercise: Exercise;
  added: boolean;
  onSelect: (exercise: Exercise) => void;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 hover:bg-secondary"
      )}
    >
      <button type="button" onClick={() => onSelect(exercise)} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium">{exercise.name}</p>
      </button>
      <div className="flex shrink-0 items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`${exercise.name} details`}
              className="flex size-6 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <Info size={15} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 text-xs" align="end">
            <p className="font-medium capitalize text-foreground">{exercise.name}</p>
            <p className="mt-1 capitalize text-muted-foreground">
              {exercise.primaryMuscle} · {exercise.equipment}
              {exercise.secondaryMuscles.length > 0 && ` · also ${exercise.secondaryMuscles.join(", ")}`}
            </p>
          </PopoverContent>
        </Popover>
        {added && <Check size={16} className="text-primary" />}
      </div>
    </div>
  );
}
