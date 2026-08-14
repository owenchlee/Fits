"use client";

import * as React from "react";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/db";
import { createExercise } from "@/lib/db/repo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Equipment, Exercise, MuscleGroup } from "@/lib/db/types";

const MUSCLES: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "forearms",
  "traps",
  "full-body",
];

const EQUIPMENT: Equipment[] = ["barbell", "dumbbell", "machine", "cable", "bodyweight", "kettlebell", "bands", "other"];

function ChipPicker<T extends string>({ options, value, onChange }: { options: T[]; value: T | null; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
            value === o ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function AddExerciseDialog({
  trigger,
  onCreated,
}: {
  trigger?: React.ReactNode;
  onCreated?: (exercise: Exercise) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [primaryMuscle, setPrimaryMuscle] = React.useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = React.useState<Equipment | null>(null);
  const [isUnilateral, setIsUnilateral] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  function reset() {
    setName("");
    setPrimaryMuscle(null);
    setEquipment(null);
    setIsUnilateral(false);
    setSaving(false);
  }

  const canSave = name.trim().length > 0 && !!primaryMuscle && !!equipment;

  async function handleSave() {
    if (!canSave || !primaryMuscle || !equipment) return;
    setSaving(true);
    const id = await createExercise({ name: name.trim(), primaryMuscle, equipment, isUnilateral });
    const exercise = await db.exercises.get(id);
    setOpen(false);
    reset();
    if (exercise) onCreated?.(exercise);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" size="lg">
            <Plus size={16} /> Add exercise
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a custom exercise</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="exercise-name">Name</Label>
            <Input
              id="exercise-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DB Bulgarian Split Squat"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="mb-1.5">Primary muscle</Label>
            <ChipPicker options={MUSCLES} value={primaryMuscle} onChange={setPrimaryMuscle} />
          </div>

          <div>
            <Label className="mb-1.5">Equipment</Label>
            <ChipPicker options={EQUIPMENT} value={equipment} onChange={setEquipment} />
          </div>

          <div className="flex items-start justify-between gap-3 rounded-xl bg-secondary/60 p-3">
            <div>
              <Label htmlFor="exercise-unilateral">Single arm / single leg</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                The weight you log is that side&apos;s full working load, so we don&apos;t double it for stats.
              </p>
            </div>
            <Switch id="exercise-unilateral" checked={isUnilateral} onCheckedChange={setIsUnilateral} />
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave || saving}>
            Add exercise
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
