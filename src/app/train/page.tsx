"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Barbell, ClipboardText } from "@phosphor-icons/react/dist/ssr";
import { useActiveWorkout } from "@/lib/db/hooks";
import { startWorkout } from "@/lib/db/repo";
import { WorkoutLogger } from "@/components/train/workout-logger";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

function TrainContent() {
  const router = useRouter();
  const params = useSearchParams();
  const workoutIdParam = params.get("workoutId");
  const activeWorkout = useActiveWorkout();

  const workoutId = workoutIdParam ?? activeWorkout?.id;

  if (workoutId) {
    return <WorkoutLogger workoutId={workoutId} />;
  }

  async function handleQuickStart() {
    const id = await startWorkout({ title: "Quick Workout" });
    router.push(`/train?workoutId=${id}`);
  }

  return (
    <EmptyState
      icon={Barbell}
      title="Ready to train?"
      description="Start an empty session and add exercises as you go, or follow a preset program."
      action={
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Button size="lg" onClick={handleQuickStart}>
            Start empty workout
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/programs">
              <ClipboardText size={16} /> Browse programs
            </Link>
          </Button>
        </div>
      }
      className="mt-10"
    />
  );
}

export default function TrainPage() {
  return (
    <Suspense fallback={null}>
      <TrainContent />
    </Suspense>
  );
}
