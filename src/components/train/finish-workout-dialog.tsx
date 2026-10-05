"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/db";
import { completeWorkout } from "@/lib/db/repo";
import { toTotalLoadKg } from "@/lib/calc/load";
import { formatWeight } from "@/lib/calc/units";
import { useRestTimer } from "@/lib/timer/rest-timer-context";
import type { SetEntry, UnitSystem } from "@/lib/db/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function FinishWorkoutDialog({
  workoutId,
  startedAt,
  sets,
  unit,
  disabled,
}: {
  workoutId: string;
  startedAt: number;
  sets: SetEntry[];
  unit: UnitSystem;
  disabled?: boolean;
}) {
  const router = useRouter();
  const restTimer = useRestTimer();
  const [durationMin, setDurationMin] = React.useState(1);
  const workingSets = sets.filter((s) => !s.isWarmup && s.reps > 0);
  const unloggedCount = sets.filter((s) => s.reps <= 0).length;
  const [finishing, setFinishing] = React.useState(false);
  // Keyed by a string so the live query isn't re-subscribed on every render (workingSets is a fresh array each time).
  const exerciseKey = Array.from(new Set(workingSets.map((s) => s.exerciseId))).join(",");
  const exercises = useLiveQuery(() => db.exercises.bulkGet(exerciseKey ? exerciseKey.split(",") : []), [exerciseKey]);
  const exerciseById = new Map((exercises ?? []).filter((e) => !!e).map((e) => [e!.id, e!]));
  const volumeKg = workingSets.reduce((sum, s) => sum + toTotalLoadKg(s.weightKg, exerciseById.get(s.exerciseId)) * s.reps, 0);

  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);
    await completeWorkout(workoutId);
    restTimer.stop();
    toast.success("Workout logged", {
      description: `${workingSets.length} sets · ${formatWeight(volumeKg, unit, { decimals: 0 })} volume`,
      icon: <CheckCircle weight="fill" />,
    });
    router.push("/");
  }

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (open) setDurationMin(Math.max(1, Math.round((Date.now() - startedAt) / 60000)));
      }}
    >
      <AlertDialogTrigger asChild>
        <Button size="lg" disabled={disabled}>
          Finish
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Finish this workout?</AlertDialogTitle>
          <AlertDialogDescription>
            {workingSets.length} working sets · {formatWeight(volumeKg, unit, { decimals: 0 })} total volume ·{" "}
            {durationMin} min
            {unloggedCount > 0 && (
              <>
                <br />
                {unloggedCount} empty set{unloggedCount === 1 ? "" : "s"} with no reps will be removed.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep going</AlertDialogCancel>
          <AlertDialogAction disabled={finishing} onClick={() => void handleFinish()}>
            Finish workout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
