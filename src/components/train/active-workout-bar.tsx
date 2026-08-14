"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PlayCircle } from "@phosphor-icons/react/dist/ssr";
import { useActiveWorkout } from "@/lib/db/hooks";
import { useKeyboardVisible } from "@/lib/hooks/use-keyboard-visible";

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Persistent "resume workout" pill shown on every screen except /train itself — this is how
 * an in-progress session stays reachable now that there's no dedicated Train tab. */
export function ActiveWorkoutBar() {
  const pathname = usePathname();
  const activeWorkout = useActiveWorkout();
  const keyboardVisible = useKeyboardVisible();
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!activeWorkout) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeWorkout]);

  const visible = !!activeWorkout && !pathname.startsWith("/train") && !keyboardVisible;

  return (
    <AnimatePresence>
      {visible && activeWorkout && (
        <motion.div
          initial={{ y: 48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 48, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 260 }}
          className="fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex justify-center md:inset-x-auto md:bottom-4 md:left-[calc(15rem+0.75rem)] md:right-3 md:justify-end"
        >
          <Link
            href={`/train?workoutId=${activeWorkout.id}`}
            className="flex w-full max-w-sm items-center gap-3 rounded-full border border-primary/40 bg-primary/15 px-4 py-2.5 shadow-lg backdrop-blur supports-backdrop-blur:bg-primary/10 md:max-w-xs"
          >
            <PlayCircle size={24} weight="fill" className="shrink-0 text-primary" />
            <span className="flex-1 truncate text-sm font-semibold text-primary">Resume Workout</span>
            <span className="shrink-0 font-display text-sm font-bold tabular-nums text-primary">
              {formatElapsed(now - activeWorkout.startedAt)}
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
