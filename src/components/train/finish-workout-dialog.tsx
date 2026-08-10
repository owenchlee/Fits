"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { completeWorkout } from "@/lib/db/repo";
import { formatWeight } from "@/lib/calc/units";
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
  const [durationMin, setDurationMin] = React.useState(1);
  const workingSets = sets.filter((s) => !s.isWarmup);
  const volumeKg = workingSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);

  async function handleFinish() {
    await completeWorkout(workoutId);
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
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep going</AlertDialogCancel>
          <AlertDialogAction onClick={handleFinish}>Finish workout</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
