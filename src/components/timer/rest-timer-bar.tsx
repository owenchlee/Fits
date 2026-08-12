"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X } from "@phosphor-icons/react/dist/ssr";
import { useRestTimer } from "@/lib/timer/rest-timer-context";
import { cn } from "@/lib/utils";

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RestTimerBar() {
  const { label, totalSeconds, secondsLeft, isRunning, addTime, pause, resume, stop } =
    useRestTimer();

  const active = totalSeconds > 0;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const circumference = 2 * Math.PI * 18;
  const dashoffset = circumference * (1 - progress);
  const finished = active && secondsLeft === 0 && !isRunning;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 260 }}
          className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-3 md:bottom-4 md:left-[calc(15rem+0.75rem)] md:right-3 md:justify-end"
        >
          <div
            className={cn(
              "flex w-full max-w-md items-center gap-3 rounded-2xl border border-border bg-card/95 p-2.5 pr-3 shadow-lg backdrop-blur supports-backdrop-blur:bg-card/80",
              finished && "border-highlight/50"
            )}
          >
            <button
              onClick={() => (isRunning ? pause() : resume())}
              aria-label={isRunning ? "Pause rest timer" : "Resume rest timer"}
              className="relative flex size-11 shrink-0 items-center justify-center rounded-full"
            >
              <svg viewBox="0 0 40 40" className="size-11 -rotate-90">
                <circle cx="20" cy="20" r="18" className="fill-none stroke-muted" strokeWidth="3" />
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  className={cn("fill-none stroke-primary transition-[stroke-dashoffset]", finished && "stroke-highlight")}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashoffset}
                />
              </svg>
              <span className="absolute text-[10px] font-semibold tabular-nums">
                {isRunning ? "II" : "▶"}
              </span>
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-muted-foreground">
                {finished ? "Rest complete" : label ?? "Resting"}
              </p>
              <p className="font-display text-xl font-semibold tabular-nums leading-none">
                {finished ? formatClock(0) : formatClock(secondsLeft)}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => addTime(-15)}
                className="flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-muted"
                aria-label="Subtract 15 seconds"
              >
                <Minus size={14} weight="bold" />
              </button>
              <button
                onClick={() => addTime(15)}
                className="flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-muted"
                aria-label="Add 15 seconds"
              >
                <Plus size={14} weight="bold" />
              </button>
              <button
                onClick={stop}
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Dismiss timer"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
