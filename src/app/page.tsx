"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Flame, ArrowRight, Barbell, ClipboardText, Trophy, PlayCircle } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/db";
import { useActiveWorkout, useProgram, useSettings } from "@/lib/db/hooks";
import { startWorkout } from "@/lib/db/repo";
import { scheduledDayIndexFor } from "@/lib/schedule";
import { estimateOneRepMax } from "@/lib/calc/one-rep-max";
import { toTotalLoadKg } from "@/lib/calc/load";
import { formatWeight } from "@/lib/calc/units";
import { LIFT_LABELS, type StandardLift } from "@/lib/calc/strength-standards";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

function useWeeklyStats() {
  return useLiveQuery(async () => {
    const weekAgo = Date.now() - 7 * 86400000;
    const [sets, workouts, allWorkouts] = await Promise.all([
      db.sets.filter((s) => s.completedAt >= weekAgo && !s.isWarmup).toArray(),
      db.workouts.filter((w) => (w.completedAt ?? w.startedAt) >= weekAgo).toArray(),
      db.workouts.filter((w) => !!w.completedAt).toArray(),
    ]);
    const exercises = await db.exercises.bulkGet(Array.from(new Set(sets.map((s) => s.exerciseId))));
    const exerciseById = new Map(exercises.filter((e) => !!e).map((e) => [e!.id, e!]));
    const volumeKg = sets.reduce((sum, s) => sum + toTotalLoadKg(s.weightKg, exerciseById.get(s.exerciseId)) * s.reps, 0);
    return { volumeKg, workoutsThisWeek: workouts.length, totalWorkouts: allWorkouts.length };
  }, []);
}

function useMainLiftPRs() {
  return useLiveQuery(async () => {
    const exercises = await db.exercises.filter((e) => e.standardLift !== null).toArray();
    const results: Partial<Record<StandardLift, number>> = {};
    for (const ex of exercises) {
      const sets = await db.sets.where("exerciseId").equals(ex.id).toArray();
      const best = sets.reduce((max, s) => Math.max(max, estimateOneRepMax(toTotalLoadKg(s.weightKg, ex), s.reps)), 0);
      const lift = ex.standardLift as StandardLift;
      results[lift] = Math.max(results[lift] ?? 0, best);
    }
    return results;
  }, []);
}

export default function DashboardPage() {
  const router = useRouter();
  const settings = useSettings();
  const activeWorkout = useActiveWorkout();
  const activeProgram = useProgram(settings.activeProgramId);
  const weekly = useWeeklyStats();
  const prs = useMainLiftPRs();

  const usingSchedule = !!activeProgram?.schedule;
  const scheduledDayIndex = usingSchedule ? scheduledDayIndexFor(activeProgram!, new Date()) : undefined;
  const isRestToday = usingSchedule && (scheduledDayIndex === null || scheduledDayIndex === undefined);

  const dayIndex = settings.activeProgramDayIndex ?? 0;
  const nextDay = activeProgram
    ? usingSchedule
      ? scheduledDayIndex !== null && scheduledDayIndex !== undefined
        ? activeProgram.days[scheduledDayIndex]
        : undefined
      : activeProgram.days[dayIndex % activeProgram.days.length]
    : undefined;

  async function handleQuickStart() {
    const id = await startWorkout({ title: "Quick Workout" });
    router.push(`/train?workoutId=${id}`);
  }

  async function handleStartProgramDay() {
    if (!activeProgram || !nextDay) return;
    const id = await startWorkout({
      programId: activeProgram.id,
      programDayName: nextDay.name,
      title: `${activeProgram.name} — ${nextDay.name}`,
      exerciseOrder: nextDay.exercises.map((e) => e.exerciseId),
    });
    router.push(`/train?workoutId=${id}`);
  }

  const liftOrder: StandardLift[] = ["squat", "bench", "deadlift", "overhead-press"];

  return (
    <div className="pb-6">
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        title="Overview"
        action={
          settings.streak > 0 ? (
            <div className="flex items-center gap-1.5 rounded-full border border-highlight/30 bg-highlight/10 px-3 py-1.5">
              <Flame size={16} weight="fill" className="text-highlight" />
              <span className="font-display text-sm font-bold tabular-nums">{settings.streak}</span>
              <span className="text-xs text-muted-foreground">day streak</span>
            </div>
          ) : undefined
        }
      />

      {activeWorkout && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Link
            href={`/train?workoutId=${activeWorkout.id}`}
            className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3.5 transition-colors hover:bg-primary/15"
          >
            <div className="flex items-center gap-3">
              <PlayCircle size={22} weight="fill" className="text-primary" />
              <div>
                <p className="text-sm font-semibold">Workout in progress</p>
                <p className="text-xs text-muted-foreground">{activeWorkout.title} — tap to resume</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-primary" />
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Streak" value={String(settings.streak)} unit="days" icon={Flame} accent />
        <StatCard
          label="Week Volume"
          value={weekly ? formatWeight(weekly.volumeKg, settings.unitSystem, { decimals: 0 }).split(" ")[0] : "—"}
          unit={settings.unitSystem}
          icon={Barbell}
        />
        <StatCard label="Workouts (7d)" value={String(weekly?.workoutsThisWeek ?? 0)} icon={ClipboardText} />
        <StatCard label="Total Workouts" value={String(weekly?.totalWorkouts ?? 0)} icon={Trophy} />
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        {activeProgram && isRestToday ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Today&apos;s session · {activeProgram.name}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold">Rest day</h2>
            <p className="mt-1 text-sm text-muted-foreground">No workout scheduled today. Recover, or log one anyway.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={handleQuickStart} disabled={!!activeWorkout} variant="outline" size="lg">
                Start empty workout
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/calendar">Edit schedule</Link>
              </Button>
            </div>
          </>
        ) : activeProgram && nextDay ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Today&apos;s session · {activeProgram.name}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold">{nextDay.name}</h2>
            <ul className="mt-3 space-y-1.5">
              {nextDay.exercises.slice(0, 5).map((ex) => (
                <ExercisePreviewRow key={ex.exerciseId} exerciseId={ex.exerciseId} sets={ex.targetSets} reps={ex.targetReps} />
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={handleStartProgramDay} disabled={!!activeWorkout} size="lg">
                Start {nextDay.name}
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/programs">Change program</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold">No program active</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Follow a proven program or jump straight into a freestyle session.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={handleQuickStart} disabled={!!activeWorkout} size="lg">
                Start empty workout
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/programs">Browse programs</Link>
              </Button>
            </div>
          </>
        )}
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Personal Records</h2>
          <Link href="/statistics?tab=overview" className="flex items-center gap-1 text-sm font-medium text-primary">
            See percentile <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {liftOrder.map((lift) => (
            <div key={lift} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">{LIFT_LABELS[lift]}</p>
              <p className="mt-2 font-display text-2xl font-bold tabular-nums">
                {prs?.[lift] ? formatWeight(prs[lift]!, settings.unitSystem, { decimals: 0 }) : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">est. 1RM</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ExercisePreviewRow({ exerciseId, sets, reps }: { exerciseId: string; sets: number; reps: string }) {
  const exercise = useLiveQuery(() => db.exercises.get(exerciseId), [exerciseId]);
  return (
    <li className="flex items-center justify-between text-sm">
      <span className="text-foreground">{exercise?.name ?? "…"}</span>
      <span className="tabular-nums text-muted-foreground">
        {sets} {reps ? `× ${reps}` : "sets"}
      </span>
    </li>
  );
}
