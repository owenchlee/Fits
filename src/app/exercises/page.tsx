"use client";

import * as React from "react";
import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { useExercises } from "@/lib/db/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

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
  const [query, setQuery] = React.useState("");
  const [muscle, setMuscle] = React.useState<(typeof MUSCLE_FILTERS)[number]>("all");

  const filtered = exercises.filter((e) => {
    const matchesQuery = e.name.toLowerCase().includes(query.toLowerCase());
    const matchesMuscle = muscle === "all" || e.primaryMuscle === muscle;
    return matchesQuery && matchesMuscle;
  });

  return (
    <div className="pb-6">
      <PageHeader title="Exercise Library" description={`${exercises.length} exercises to build your workouts from.`} />

      <div className="relative mb-3">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises"
          className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm focus:border-ring focus:outline-none"
        />
      </div>

      <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1 no-scrollbar">
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
          </Link>
        ))}
      </div>
    </div>
  );
}
