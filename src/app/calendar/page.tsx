"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  CalendarBlank,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  CheckCircle,
  PlayCircle,
  Plus,
  X,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/db";
import { useActiveWorkout, useProgram, useSettings } from "@/lib/db/hooks";
import { startWorkout, updateProgram } from "@/lib/db/repo";
import { addDays, dateKey, isSameDay, startOfWeek, WEEKDAY_LABELS } from "@/lib/date";
import { scheduledDayIndexFor } from "@/lib/schedule";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
        <PageHeader title="Calendar" description="Build a rotating cycle for your program and track adherence." />
        <EmptyState
          icon={CalendarBlank}
          title="No active program"
          description="Set a program as active to build a rotating cycle for it."
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
  const cycleStartDate = activeProgram.cycleStartDate;

  async function setSlot(i: number, value: number | null) {
    const next = (schedule ?? []).slice();
    next[i] = value;
    await updateProgram(activeProgram!.id, { schedule: next });
  }

  async function addSlot() {
    const next = [...(schedule ?? []), null];
    await updateProgram(activeProgram!.id, {
      schedule: next,
      cycleStartDate: cycleStartDate ?? dateKey(new Date()),
    });
  }

  async function removeSlot(i: number) {
    const next = (schedule ?? []).filter((_, idx) => idx !== i);
    await updateProgram(activeProgram!.id, {
      schedule: next.length > 0 ? next : undefined,
      cycleStartDate: next.length > 0 ? cycleStartDate : undefined,
    });
  }

  async function moveSlot(i: number, dir: -1 | 1) {
    const next = (schedule ?? []).slice();
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    await updateProgram(activeProgram!.id, { schedule: next });
  }

  async function setCycleStart(value: string) {
    await updateProgram(activeProgram!.id, { cycleStartDate: value });
  }

  async function enableSchedule() {
    await updateProgram(activeProgram!.id, {
      schedule: activeProgram!.days.map((_, i) => i),
      cycleStartDate: dateKey(new Date()),
    });
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
        description={`Rotating cycle for ${activeProgram.name}. Build a sequence like Push, Pull, Legs, Rest — it repeats on its own schedule, independent of the day of the week.`}
      />

      {!schedule ? (
        <EmptyState
          icon={CalendarBlank}
          title="No cycle set up yet"
          description="Build a repeating sequence of workouts (and rest days) so your dashboard and calendar know what's due each day."
          action={
            <button
              onClick={enableSchedule}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Set up cycle
            </button>
          }
        />
      ) : (
        <>
          <div className="mb-4 space-y-1.5 rounded-2xl border border-border bg-card p-3">
            {schedule.map((slot, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <select
                  value={slot ?? "rest"}
                  onChange={(e) => setSlot(i, e.target.value === "rest" ? null : Number(e.target.value))}
                  className="h-9 flex-1 appearance-none rounded-lg border border-input bg-secondary px-2 text-sm focus:border-ring focus:outline-none"
                >
                  <option value="rest">Rest</option>
                  {activeProgram.days.map((day, di) => (
                    <option key={di} value={di}>
                      {day.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => moveSlot(i, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <CaretUp size={14} />
                </button>
                <button
                  onClick={() => moveSlot(i, 1)}
                  disabled={i === schedule.length - 1}
                  aria-label="Move down"
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <CaretDown size={14} />
                </button>
                <button
                  onClick={() => removeSlot(i)}
                  aria-label="Remove day"
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <button
              onClick={addSlot}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-input py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
            >
              <Plus size={14} /> Add day to cycle
            </button>

            <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
              <Label htmlFor="cycle-start" className="text-xs text-muted-foreground">
                Cycle day 1 falls on
              </Label>
              <input
                id="cycle-start"
                type="date"
                value={cycleStartDate ?? dateKey(new Date())}
                onChange={(e) => setCycleStart(e.target.value)}
                className="h-9 rounded-lg border border-input bg-secondary px-2 text-sm focus:border-ring focus:outline-none"
              />
            </div>
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
              const dayIndex = scheduledDayIndexFor(activeProgram, date);
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
