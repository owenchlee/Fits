"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import { deleteExercise, updateExercise } from "@/lib/db/repo";
import { ChipPicker, EQUIPMENT, MUSCLES } from "@/components/shared/add-exercise-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveOrToast } from "@/lib/save";
import type { Exercise } from "@/lib/db/types";

export function CustomExerciseActions({ exercise }: { exercise: Exercise }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(exercise.name);
  const [muscle, setMuscle] = React.useState(exercise.primaryMuscle);
  const [equipment, setEquipment] = React.useState(exercise.equipment);
  const [error, setError] = React.useState("");
  const hasSets = useLiveQuery(async () => (await db.sets.where("exerciseId").equals(exercise.id).count()) > 0, [exercise.id]);

  async function handleSave() {
    setError("");
    try {
      await updateExercise(exercise.id, { name, primaryMuscle: muscle, equipment });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save");
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (v) {
            setName(exercise.name);
            setMuscle(exercise.primaryMuscle);
            setEquipment(exercise.equipment);
            setError("");
          }
        }}
      >
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">Edit</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-exercise-name">Name</Label>
              <Input id="edit-exercise-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label className="mb-1.5">Primary muscle</Label>
              <ChipPicker label="Primary muscle" options={MUSCLES} value={muscle} onChange={setMuscle} />
            </div>
            <div>
              <Label className="mb-1.5">Equipment</Label>
              <ChipPicker label="Equipment" options={EQUIPMENT} value={equipment} onChange={setEquipment} />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSave} disabled={!name.trim()}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {hasSets ? (
        <p className="text-xs text-muted-foreground">Has logged sets, so it can&apos;t be removed.</p>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {exercise.name}?</AlertDialogTitle>
              <AlertDialogDescription>It will also be removed from your custom programs.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (await saveOrToast(() => deleteExercise(exercise.id))) router.push("/exercises");
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
