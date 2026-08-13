"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { CalendarBlank, CaretLeft, CaretRight, CheckCircle, PlayCircle, XCircle } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/db";
import { useActiveWorkout, useProgram, useSettings } from "@/lib/db/hooks";
import { startWorkout, updateProgram } from "@/lib/db/repo";
import { addDays, isSameDay, mondayIndex, startOfWeek, WEEKDAY_LABELS } from "@/lib/date";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const router = useRouter();
  const settings = useSettings();
  const activeProgram = useProgram(settings.activeProgramId);
  const activeWorkout = useActiveWorkout();
  const [weekOffset, setWeekOffset] = React.useState(0);

  const weekStart = addDays(startOfWeek(new Date()), weekOffset * 7);
  const weekEnd = addDays(weekStart, 7);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const completedInWeek = useLiveQuery(
    () =>
      db.workouts
        .filter((w) => !!w.completedAt && w.completedAt >= weekStart.getTime() && w.completedAt < weekEnd.getTime())
        .toArray(),
    [weekStart.getTime(), weekEnd.getTime()]
  );

  if (!activeProgram) {
    return (
      <div className="pb-6">
        <PageHeader title="Calendar" description="Schedule your program across the week and track adherence." />
        <EmptyState
          icon={CalendarBlank}
          title="No active program"
          description="Set a program as active to build a weekly schedule for it."
          action={
            <Link href="/programs" className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-muted">
              Browse programs
            </Link>
          }
        />
      </div>
    );
  }

  const schedule = activeProgram.schedule;

  async function setDay(weekdayIndex: number, value: number | null) {
    const next = (schedule ?? Array(7).fill(null)).slice();
    next[weekdayIndex] = value;
    await updateProgram(activeProgram!.id, { schedule: next });
  }

  async function enableSchedule() {
    await updateProgram(activeProgram!.id, { schedule: Array(7).fill(null) });
  }

  async function handleStart(dayIndex: number) {
    const day = activeProgram!.days[dayIndex];
    const id = await startWorkout({
      programId: activeProgram!.id,
      programDayName: day.name,
      title: `${activeProgram!.name} — ${day.name}`,
      exerciseOrder: day.exercises.map((e) => e.exerciseId),
    });
    router.push(`/train?workoutId=${id}`);
  }

  return (
    <div className="pb-6">
      <PageHeader
        title="Calendar"
        description={`Weekly schedule for ${activeProgram.name}. Tap a weekday below to assign a workout or a rest day.`}
      />

      {!schedule ? (
        <EmptyState
          icon={CalendarBlank}
          title="No weekly schedule yet"
          description="Assign each weekday a workout (or rest) so your dashboard and calendar know what's due when."
          action={
            <button
              onClick={enableSchedule}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Set up schedule
            </button>
          }
        />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-7 gap-1.5">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
                <select
                  value={schedule[i] ?? "rest"}
                  onChange={(e) => setDay(i, e.target.value === "rest" ? null : Number(e.target.value))}
                  className="h-9 w-full appearance-none rounded-lg border border-input bg-secondary px-1 text-center text-[11px] focus:border-ring focus:outline-none"
                >
                  <option value="rest">Rest</option>
                  {activeProgram.days.map((day, di) => (
                    <option key={di} value={di}>
                      {day.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
              aria-label="Previous week"
            >
              <CaretLeft size={16} />
            </button>
            <span className="text-sm font-medium">
              {weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} –{" "}
              {addDays(weekStart, 6).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
              aria-label="Next week"
            >
              <CaretRight size={16} />
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {weekDates.map((date, i) => {
              const dayIndex = schedule[i];
              const isRest = dayIndex === null || dayIndex === undefined;
              const dayName = isRest ? "Rest day" : activeProgram.days[dayIndex]?.name;
              const isToday = isSameDay(date, today);
              const isPast = date < today && !isToday;
              const done = (completedInWeek ?? []).some((w) => w.completedAt && isSameDay(new Date(w.completedAt), date));
              const missed = !isRest && isPast && !done;

              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3",
                    isToday ? "border-primary/50 bg-primary/5" : "border-border bg-card"
                  )}
                >
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {WEEKDAY_LABELS[i]} · {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      {isToday && <span className="ml-1.5 font-semibold text-primary">Today</span>}
                    </p>
                    <p className="text-sm font-medium">{dayName}</p>
                  </div>

                  {done && <CheckCircle size={20} weight="fill" className="text-primary" />}
                  {missed && <XCircle size={20} weight="fill" className="text-destructive/70" />}
                  {isToday && !isRest && !done && (
                    <Button size="sm" disabled={!!activeWorkout} onClick={() => handleStart(dayIndex!)}>
                      <PlayCircle size={14} /> Start
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
