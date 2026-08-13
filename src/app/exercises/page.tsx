"use client";

import * as React from "react";
import Link from "next/link";
import { Barbell, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { useExercises, useLoggedExerciseIds } from "@/lib/db/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { AddExerciseDialog } from "@/components/shared/add-exercise-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

const SCOPE_TABS = [
  { value: "mine", label: "Yours" },
  { value: "all", label: "All" },
] as const;

const MUSCLE_FILTERS = [
  "all",
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "traps",
  "full-body",
] as const;

export default function ExercisesPage() {
  const exercises = useExercises();
  const loggedIds = useLoggedExerciseIds();
  const [scope, setScope] = React.useState<(typeof SCOPE_TABS)[number]["value"]>("mine");
  const [query, setQuery] = React.useState("");
  const [muscle, setMuscle] = React.useState<(typeof MUSCLE_FILTERS)[number]>("all");

  const scoped = scope === "mine" ? exercises.filter((e) => loggedIds.has(e.id)) : exercises;
  const filtered = scoped.filter((e) => {
    const matchesQuery = e.name.toLowerCase().includes(query.toLowerCase());
    const matchesMuscle = muscle === "all" || e.primaryMuscle === muscle;
    return matchesQuery && matchesMuscle;
  });

  return (
    <div className="pb-6">
      <PageHeader
        title="Exercise Library"
        description={
          scope === "mine"
            ? `${loggedIds.size} exercise${loggedIds.size === 1 ? "" : "s"} you've logged.`
            : `${exercises.length} exercises to build your workouts from.`
        }
        action={<AddExerciseDialog />}
      />

      <div className="mb-3 grid grid-cols-2 gap-1.5">
        {SCOPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setScope(tab.value)}
            className={cn(
              "rounded-lg py-2 text-sm font-medium transition-colors",
              scope === tab.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative mb-3">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises"
          className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm focus:border-ring focus:outline-none"
        />
      </div>

      <div className="-mx-1 mb-4 flex flex-wrap gap-1.5 px-1 pb-1">
        {MUSCLE_FILTERS.map((m) => (
          <button
            key={m}
            onClick={() => setMuscle(m)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              muscle === m ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {filtered.length === 0 && scope === "mine" ? (
        <EmptyState
          icon={Barbell}
          title="No logged exercises yet"
          description="Log a set during a workout and it'll show up here. Switch to “All” to browse the full library."
          action={
            <button
              onClick={() => setScope("all")}
              className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-muted"
            >
              Browse all exercises
            </button>
          }
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((ex) => (
            <Link
              key={ex.id}
              href={`/exercises/${ex.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
            >
              <div>
                <p className="text-sm font-medium">{ex.name}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {ex.primaryMuscle} · {ex.equipment}
                </p>
              </div>
              {ex.standardLift && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                  Tracked
                </span>
              )}
              {ex.isCustom && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                  Custom
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
