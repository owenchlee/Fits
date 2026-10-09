"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, PlayCircle, X } from "@phosphor-icons/react/dist/ssr";
import { useActiveWorkout } from "@/lib/db/hooks";
import { useRestTimer } from "@/lib/timer/rest-timer-context";
import { useKeyboardVisible } from "@/lib/hooks/use-keyboard-visible";
import { cn } from "@/lib/utils";

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Persistent bar for an in-progress workout and/or its rest timer. Off /train it doubles as the
 * "resume workout" pill — tapping it (outside the timer's own controls) jumps back into the
 * session whether or not a rest timer happens to be running too, so the two states never stack
 * into two overlapping pills. */
export function ActiveWorkoutBar() {
  const pathname = usePathname();
  const activeWorkout = useActiveWorkout();
  const restTimer = useRestTimer();
  const keyboardVisible = useKeyboardVisible();
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!activeWorkout) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeWorkout]);

  const onTrainPage = pathname.startsWith("/train");
  const resting = restTimer.totalSeconds > 0;
  const finished = resting && restTimer.secondsLeft === 0 && !restTimer.isRunning;
  // Already on the workout screen, or no workout to resume — nothing to link to.
  const asLink = !onTrainPage && !!activeWorkout;
  const visible = !keyboardVisible && (onTrainPage ? resting : !!activeWorkout || resting);

  const progress = resting ? (restTimer.totalSeconds - restTimer.secondsLeft) / restTimer.totalSeconds : 0;
  const circumference = 2 * Math.PI * 18;
  const dashoffset = circumference * (1 - progress);

  const label = resting ? (finished ? "Rest complete" : restTimer.label ?? "Resting") : "Resume Workout";
  const value = resting
    ? formatClock(finished ? 0 : restTimer.secondsLeft)
    : activeWorkout
      ? formatElapsed(now - activeWorkout.startedAt)
      : null;

  const bar = (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border p-2.5 pr-3 shadow-lg backdrop-blur",
        resting
          ? "border-border bg-card/95 supports-backdrop-blur:bg-card/80"
          : "border-primary/40 bg-primary/15 supports-backdrop-blur:bg-primary/10",
        finished && "border-highlight/50"
      )}
    >
      {resting ? (
        <button
          onClick={(e) => {
            e.preventDefault();
            if (restTimer.isRunning) restTimer.pause();
            else restTimer.resume();
          }}
          aria-label={restTimer.isRunning ? "Pause rest timer" : "Resume rest timer"}
          className="relative flex size-11 shrink-0 items-center justify-center rounded-full"
        >
          <svg viewBox="0 0 40 40" className="size-11 -rotate-90">
            <circle cx="20" cy="20" r="18" className="fill-none stroke-muted" strokeWidth="3" />
            <circle
              cx="20"
              cy="20"
              r="18"
              className={cn(
                "fill-none stroke-primary transition-[stroke-dashoffset]",
                finished && "stroke-highlight"
              )}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
            />
          </svg>
          <span className="absolute text-[10px] font-semibold tabular-nums">
            {restTimer.isRunning ? "II" : "▶"}
          </span>
        </button>
      ) : (
        <PlayCircle size={24} weight="fill" className="shrink-0 text-primary" />
      )}

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[11px] font-medium",
            resting ? "text-muted-foreground" : "font-semibold text-primary"
          )}
        >
          {label}
        </p>
        {resting && (
          <p className="font-display text-xl font-semibold tabular-nums leading-none">{value}</p>
        )}
      </div>

      {!resting && value && (
        <span className="shrink-0 font-display text-sm font-bold tabular-nums text-primary">{value}</span>
      )}

      {resting && (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              restTimer.addTime(-15);
            }}
            className="flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-muted"
            aria-label="Subtract 15 seconds"
          >
            <Minus size={14} weight="bold" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              restTimer.addTime(15);
            }}
            className="flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-muted"
            aria-label="Add 15 seconds"
          >
            <Plus size={14} weight="bold" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              restTimer.stop();
            }}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Dismiss timer"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 260 }}
          className="fixed inset-x-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center md:inset-x-auto md:bottom-4 md:left-[calc(15rem+0.75rem)] md:right-3 md:justify-end"
        >
          {asLink && activeWorkout ? (
            <Link href={`/train?workoutId=${activeWorkout.id}`} className="w-full max-w-sm md:max-w-xs">
              {bar}
            </Link>
          ) : (
            <div className="w-full max-w-sm md:max-w-xs">{bar}</div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
