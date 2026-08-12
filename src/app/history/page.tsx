"use client";

import Link from "next/link";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import { useCompletedWorkouts, useSettings } from "@/lib/db/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

function groupByMonth(workouts: ReturnType<typeof useCompletedWorkouts>) {
  const groups = new Map<string, typeof workouts>();
  for (const w of workouts) {
    const key = new Date(w.completedAt!).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(w);
  }
  return groups;
}

export default function HistoryPage() {
  useSettings();
  const workouts = useCompletedWorkouts();
  const groups = groupByMonth(workouts);

  return (
    <div className="pb-6">
      <PageHeader title="History" description={`${workouts.length} completed workouts.`} />

      {workouts.length === 0 ? (
        <EmptyState
          icon={ClockCounterClockwise}
          title="Nothing logged yet"
          description="Finish a workout and it'll show up here, organized by month."
        />
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([month, items]) => (
            <div key={month}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{month}</h2>
              <div className="space-y-2">
                {items.map((w) => {
                  const durationMin = w.completedAt ? Math.round((w.completedAt - w.startedAt) / 60000) : 0;
                  return (
                    <Link
                      key={w.id}
                      href={`/history/${w.id}`}
                      className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
                    >
                      <div>
                        <p className="text-sm font-medium">{w.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(w.completedAt!).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <span className="tabular-nums text-xs text-muted-foreground">{durationMin} min</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
